const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * POST /api/batches
 */
const createBatch = asyncHandler(async (req, res, next) => {
  const { name, department, semester } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new AppError('Batch name is required', 400));
  }
  if (name.trim().length > 20) {
    return next(new AppError('Batch name must be 20 characters or fewer', 400));
  }
  if (!department) return next(new AppError('Department is required', 400));
  if (!semester) return next(new AppError('Semester is required', 400));

  const { data, error } = await supabase
    .from('batches')
    .insert([{ name: name.trim(), department, semester: Number(semester) }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return next(new AppError('Batch name already exists for this department and semester', 400));
    }
    logger.error('Batch creation error:', error);
    return next(new AppError('Failed to create batch', 500));
  }

  logger.info(`Batch created: ${name} (${department}, sem ${semester})`);
  res.status(201).json({ success: true, message: 'Batch created successfully', data: { batch: data } });
});

/**
 * GET /api/batches
 */
const getBatches = asyncHandler(async (req, res, next) => {
  const { department, semester } = req.query;

  let query = supabase.from('batches').select('*').order('name');
  if (department) query = query.eq('department', department);
  if (semester) query = query.eq('semester', Number(semester));

  const { data, error } = await query;
  if (error) {
    logger.error('Error fetching batches:', error);
    return next(new AppError('Failed to fetch batches', 500));
  }

  res.status(200).json({ success: true, count: data.length, data: { batches: data } });
});

/**
 * PUT /api/batches/:id
 */
const updateBatch = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new AppError('Batch name is required', 400));
  }
  if (name.trim().length > 20) {
    return next(new AppError('Batch name must be 20 characters or fewer', 400));
  }

  const { data, error } = await supabase
    .from('batches')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return next(new AppError('Batch not found', 404));
    logger.error('Batch update error:', error);
    return next(new AppError('Failed to update batch', 500));
  }
  if (!data) return next(new AppError('Batch not found', 404));

  res.status(200).json({ success: true, message: 'Batch updated successfully', data: { batch: data } });
});

/**
 * DELETE /api/batches/:id
 */
const deleteBatch = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check exists first
  const { data: existing } = await supabase.from('batches').select('id').eq('id', id).single();
  if (!existing) return next(new AppError('Batch not found', 404));

  const { error } = await supabase.from('batches').delete().eq('id', id);
  if (error) {
    logger.error('Batch delete error:', error);
    return next(new AppError('Failed to delete batch', 500));
  }

  res.status(200).json({ success: true, message: 'Batch deleted successfully' });
});

/**
 * GET /api/batches/:id/assignments
 */
const getBatchAssignments = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const { data: batch } = await supabase.from('batches').select('id').eq('id', id).single();
  if (!batch) return next(new AppError('Batch not found', 404));

  const { data, error } = await supabase
    .from('batch_assignments')
    .select(`
      *,
      course:courses(id, course_name, course_type, rotation_group),
      room:rooms(id, room_name),
      slot:time_slots(id, day, start_time, end_time)
    `)
    .eq('batch_id', id)
    .order('week_number')
    .order('day');

  if (error) {
    logger.error('Error fetching batch assignments:', error);
    return next(new AppError('Failed to fetch batch assignments', 500));
  }

  res.status(200).json({ success: true, count: data.length, data: { assignments: data } });
});

module.exports = { createBatch, getBatches, updateBatch, deleteBatch, getBatchAssignments };
