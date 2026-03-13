const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * @route   POST /api/time-slots
 * @desc    Create a new time slot
 * @access  Private (Admin only)
 */
const createTimeSlot = asyncHandler(async (req, res, next) => {
  const { day, start_time, end_time } = req.body;

  const { data, error } = await supabase
    .from('time_slots')
    .insert([{ day, start_time, end_time }])
    .select()
    .single();

  if (error) {
    logger.error('Time slot creation error:', error);
    return next(new AppError('Failed to create time slot', 500));
  }

  logger.info(`Time slot created: ${day} ${start_time}-${end_time}`);

  res.status(201).json({
    success: true,
    message: 'Time slot created successfully',
    data: { timeSlot: data }
  });
});

/**
 * @route   GET /api/time-slots
 * @desc    Get all time slots
 * @access  Private
 */
const getTimeSlots = asyncHandler(async (req, res, next) => {
  const { day } = req.query;

  let query = supabase
    .from('time_slots')
    .select('*')
    .order('day', { ascending: true })
    .order('start_time', { ascending: true });

  if (day) {
    query = query.eq('day', day);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching time slots:', error);
    return next(new AppError('Failed to fetch time slots', 500));
  }

  res.status(200).json({
    success: true,
    count: data.length,
    data: { timeSlots: data }
  });
});

/**
 * @route   PUT /api/time-slots/:id
 * @desc    Update time slot
 * @access  Private (Admin only)
 */
const updateTimeSlot = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const { data, error } = await supabase
    .from('time_slots')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Time slot update error:', error);
    return next(new AppError('Failed to update time slot', 500));
  }

  logger.info(`Time slot updated: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Time slot updated successfully',
    data: { timeSlot: data }
  });
});

/**
 * @route   DELETE /api/time-slots/:id
 * @desc    Delete time slot
 * @access  Private (Admin only)
 */
const deleteTimeSlot = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('time_slots')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Time slot deletion error:', error);
    return next(new AppError('Failed to delete time slot', 500));
  }

  logger.info(`Time slot deleted: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Time slot deleted successfully'
  });
});

module.exports = {
  createTimeSlot,
  getTimeSlots,
  updateTimeSlot,
  deleteTimeSlot
};
