const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private (Admin only)
 */
const createCourse = asyncHandler(async (req, res, next) => {
  const { course_name, department, semester, faculty_id, weekly_hours } = req.body;

  const { data, error } = await supabase
    .from('courses')
    .insert([
      {
        course_name,
        department,
        semester,
        faculty_id,
        weekly_hours
      }
    ])
    .select()
    .single();

  if (error) {
    logger.error('Course creation error:', error);
    return next(new AppError('Failed to create course', 500));
  }

  logger.info(`Course created: ${course_name}`);

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: { course: data }
  });
});

/**
 * @route   GET /api/courses
 * @desc    Get all courses with optional filters
 * @access  Private
 */
const getCourses = asyncHandler(async (req, res, next) => {
  const { department, semester, faculty_id } = req.query;

  let query = supabase
    .from('courses')
    .select(`
      *,
      faculty:users!faculty_id(id, name, email, department)
    `);

  // Apply filters
  if (department) query = query.eq('department', department);
  if (semester) query = query.eq('semester', semester);
  if (faculty_id) query = query.eq('faculty_id', faculty_id);

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching courses:', error);
    return next(new AppError('Failed to fetch courses', 500));
  }

  res.status(200).json({
    success: true,
    count: data.length,
    data: { courses: data }
  });
});

/**
 * @route   GET /api/courses/:id
 * @desc    Get single course by ID
 * @access  Private
 */
const getCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      faculty:users!faculty_id(id, name, email, department)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return next(new AppError('Course not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { course: data }
  });
});

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course
 * @access  Private (Admin only)
 */
const updateCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const { data, error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Course update error:', error);
    return next(new AppError('Failed to update course', 500));
  }

  if (!data) {
    return next(new AppError('Course not found', 404));
  }

  logger.info(`Course updated: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    data: { course: data }
  });
});

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course
 * @access  Private (Admin only)
 */
const deleteCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if course exists in timetable
  const { data: timetableData, error: timetableError } = await supabase
    .from('timetable')
    .select('id')
    .eq('course_id', id)
    .limit(1);

  if (timetableError) {
    logger.error('Error checking timetable:', timetableError);
    return next(new AppError('Failed to validate course deletion', 500));
  }

  if (timetableData && timetableData.length > 0) {
    return next(new AppError('Cannot delete course that is part of a timetable', 400));
  }

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Course deletion error:', error);
    return next(new AppError('Failed to delete course', 500));
  }

  logger.info(`Course deleted: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully'
  });
});

module.exports = {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse
};
