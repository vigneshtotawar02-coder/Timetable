const { supabase, supabaseAdmin } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
  const { email, password, name, role, department, semester } = req.body;

  logger.info(`Registration attempt for: ${email}, role: ${role}, department: ${department}, semester: ${semester}`);

  // Validate role
  const validRoles = ['admin', 'faculty', 'student'];
  if (!validRoles.includes(role)) {
    logger.error(`Invalid role specified: ${role}`);
    return next(new AppError('Invalid role specified', 400));
  }

  // Create user with Supabase Auth
  logger.info('Creating user in Supabase Auth...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    logger.error('Auth registration error:', JSON.stringify(authError));
    return next(new AppError(authError.message, 400));
  }

  logger.info(`Auth user created with ID: ${authData.user.id}`);

  // Create user record in users table
  logger.info('Creating user record in users table...');
  const insertData = {
    id: authData.user.id,
    email,
    name,
    role,
    department
  };
  
  // Add semester for students
  if (role === 'student' && semester) {
    insertData.semester = semester;
  }
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([insertData])
    .select()
    .single();

  if (userError) {
    logger.error('User creation error:', JSON.stringify(userError));
    // Rollback - delete auth user
    logger.info('Rolling back auth user creation...');
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return next(new AppError(`Failed to create user profile: ${userError.message}`, 500));
  }

  logger.info(`New user registered successfully: ${email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userData
    }
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Sign in with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    logger.warn(`Failed login attempt for ${email}`);
    return next(new AppError('Invalid credentials', 401));
  }

  // Fetch user details
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (userError) {
    logger.error('Error fetching user data:', userError);
    return next(new AppError('Failed to fetch user details', 500));
  }

  logger.info(`User logged in: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userData,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    }
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
const logout = asyncHandler(async (req, res, next) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return next(new AppError('Logout failed', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
const getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});

/**
 * @route   GET /api/auth/users
 * @desc    Get all users with optional role filter
 * @access  Private
 */
const getUsers = asyncHandler(async (req, res, next) => {
  const { role } = req.query;

  let query = supabase
    .from('users')
    .select('*')
    .order('name', { ascending: true });

  if (role) {
    query = query.eq('role', role);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching users:', error);
    return next(new AppError('Failed to fetch users', 500));
  }

  res.status(200).json({
    success: true,
    count: data.length,
    data: {
      users: data
    }
  });
});

/**
 * @route   PUT /api/auth/users/:id
 * @desc    Update user profile
 * @access  Private (Admin or own profile)
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, department, semester } = req.body;

  // Check if user is admin or updating their own profile
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return next(new AppError('Not authorized to update this user', 403));
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (department) updateData.department = department;
  if (semester !== undefined) updateData.semester = semester;

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating user:', error);
    return next(new AppError('Failed to update user', 500));
  }

  if (!data) {
    return next(new AppError('User not found', 404));
  }

  logger.info(`User updated: ${id}`);

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: data
    }
  });
});

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if user has assigned courses
  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('id')
    .eq('faculty_id', id)
    .limit(1);

  if (coursesError) {
    logger.error('Error checking courses:', coursesError);
    return next(new AppError('Failed to validate user deletion', 500));
  }

  if (coursesData && coursesData.length > 0) {
    return next(new AppError('Cannot delete user with assigned courses', 400));
  }

  // Delete from users table
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (deleteError) {
    logger.error('Error deleting user:', deleteError);
    return next(new AppError('Failed to delete user', 500));
  }

  // Delete from Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (authError) {
    logger.error('Error deleting auth user:', authError);
    // User already deleted from users table, just log the error
  }

  logger.info(`User deleted: ${id}`);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  getUsers,
  updateUser,
  deleteUser
};
