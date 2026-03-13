const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * @route   POST /api/faculty-availability
 * @desc    Create faculty availability
 * @access  Private (Admin/Faculty)
 */
const createFacultyAvailability = asyncHandler(async (req, res, next) => {
  const { faculty_id, day, time_slot, available } = req.body;

  // Check if the requesting user is faculty and trying to set their own availability
  if (req.user.role === 'faculty' && req.user.id !== faculty_id) {
    return next(new AppError('You can only set your own availability', 403));
  }

  const { data, error } = await supabase
    .from('faculty_availability')
    .insert([{ faculty_id, day, time_slot, available }])
    .select()
    .single();

  if (error) {
    logger.error('Faculty availability creation error:', error);
    return next(new AppError('Failed to create faculty availability', 500));
  }

  logger.info(`Faculty availability created for faculty ${faculty_id}`);

  res.status(201).json({
    success: true,
    message: 'Faculty availability created successfully',
    data: { availability: data }
  });
});

/**
 * @route   POST /api/faculty-availability/bulk
 * @desc    Create multiple faculty availability entries at once
 * @access  Private (Admin/Faculty)
 */
const createBulkFacultyAvailability = asyncHandler(async (req, res, next) => {
  const { faculty_id, availabilities } = req.body;

  // Check authorization
  if (req.user.role === 'faculty' && req.user.id !== faculty_id) {
    return next(new AppError('You can only set your own availability', 403));
  }

  // Format data for insertion
  const formattedData = availabilities.map(item => ({
    faculty_id,
    day: item.day,
    time_slot: item.time_slot,
    available: item.available
  }));

  // Delete existing availabilities for this faculty
  await supabase
    .from('faculty_availability')
    .delete()
    .eq('faculty_id', faculty_id);

  // Insert new availabilities
  const { data, error } = await supabase
    .from('faculty_availability')
    .insert(formattedData)
    .select();

  if (error) {
    logger.error('Bulk faculty availability creation error:', error);
    return next(new AppError('Failed to create faculty availability', 500));
  }

  logger.info(`Bulk faculty availability created for faculty ${faculty_id}`);

  res.status(201).json({
    success: true,
    message: 'Faculty availability created successfully',
    data: { availabilities: data }
  });
});

/**
 * @route   GET /api/faculty-availability/:faculty_id
 * @desc    Get faculty availability
 * @access  Private
 */
const getFacultyAvailability = asyncHandler(async (req, res, next) => {
  const { faculty_id } = req.params;
  const { day, available } = req.query;

  let query = supabase
    .from('faculty_availability')
    .select(`
      *,
      time_slot_details:time_slots!time_slot(id, day, start_time, end_time)
    `)
    .eq('faculty_id', faculty_id)
    .order('day', { ascending: true })
    .order('time_slot', { ascending: true });

  if (day) {
    query = query.eq('day', day);
  }

  if (available !== undefined) {
    query = query.eq('available', available === 'true');
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching faculty availability:', error);
    return next(new AppError('Failed to fetch faculty availability', 500));
  }

  res.status(200).json({
    success: true,
    count: data.length,
    data: { availabilities: data }
  });
});

/**
 * @route   PUT /api/faculty-availability/:id
 * @desc    Update faculty availability
 * @access  Private (Admin/Faculty)
 */
const updateFacultyAvailability = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  // Get the availability record to check faculty_id
  const { data: existingData, error: fetchError } = await supabase
    .from('faculty_availability')
    .select('faculty_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingData) {
    return next(new AppError('Availability record not found', 404));
  }

  // Check authorization
  if (req.user.role === 'faculty' && req.user.id !== existingData.faculty_id) {
    return next(new AppError('You can only update your own availability', 403));
  }

  const { data, error } = await supabase
    .from('faculty_availability')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Faculty availability update error:', error);
    return next(new AppError('Failed to update faculty availability', 500));
  }

  logger.info(`Faculty availability updated: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Faculty availability updated successfully',
    data: { availability: data }
  });
});

/**
 * @route   DELETE /api/faculty-availability/:id
 * @desc    Delete faculty availability
 * @access  Private (Admin/Faculty)
 */
const deleteFacultyAvailability = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Get the availability record to check faculty_id
  const { data: existingData, error: fetchError } = await supabase
    .from('faculty_availability')
    .select('faculty_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingData) {
    return next(new AppError('Availability record not found', 404));
  }

  // Check authorization
  if (req.user.role === 'faculty' && req.user.id !== existingData.faculty_id) {
    return next(new AppError('You can only delete your own availability', 403));
  }

  const { error } = await supabase
    .from('faculty_availability')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Faculty availability deletion error:', error);
    return next(new AppError('Failed to delete faculty availability', 500));
  }

  logger.info(`Faculty availability deleted: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Faculty availability deleted successfully'
  });
});

module.exports = {
  createFacultyAvailability,
  createBulkFacultyAvailability,
  getFacultyAvailability,
  updateFacultyAvailability,
  deleteFacultyAvailability
};
