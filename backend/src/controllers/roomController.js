const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * @route   POST /api/rooms
 * @desc    Create a new room
 * @access  Private (Admin only)
 */
const createRoom = asyncHandler(async (req, res, next) => {
  const { room_name, capacity } = req.body;

  const { data, error } = await supabase
    .from('rooms')
    .insert([{ room_name, capacity }])
    .select()
    .single();

  if (error) {
    logger.error('Room creation error:', error);
    return next(new AppError('Failed to create room', 500));
  }

  logger.info(`Room created: ${room_name}`);

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: { room: data }
  });
});

/**
 * @route   GET /api/rooms
 * @desc    Get all rooms
 * @access  Private
 */
const getRooms = asyncHandler(async (req, res, next) => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('room_name', { ascending: true });

  if (error) {
    logger.error('Error fetching rooms:', error);
    return next(new AppError('Failed to fetch rooms', 500));
  }

  res.status(200).json({
    success: true,
    count: data.length,
    data: { rooms: data }
  });
});

/**
 * @route   PUT /api/rooms/:id
 * @desc    Update room
 * @access  Private (Admin only)
 */
const updateRoom = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const { data, error } = await supabase
    .from('rooms')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Room update error:', error);
    return next(new AppError('Failed to update room', 500));
  }

  logger.info(`Room updated: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Room updated successfully',
    data: { room: data }
  });
});

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Delete room
 * @access  Private (Admin only)
 */
const deleteRoom = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Room deletion error:', error);
    return next(new AppError('Failed to delete room', 500));
  }

  logger.info(`Room deleted: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Room deleted successfully'
  });
});

module.exports = {
  createRoom,
  getRooms,
  updateRoom,
  deleteRoom
};
