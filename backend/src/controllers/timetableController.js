const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const TimetableService = require('../services/timetableService');

/**
 * @route   POST /api/timetable/generate
 * @desc    Generate timetable for a department and semester
 * @access  Private (Admin only)
 */
const generateTimetable = asyncHandler(async (req, res, next) => {
  const { department, semester } = req.body;

  logger.info(`Starting timetable generation for ${department} - Semester ${semester}`);

  // Fetch all required data
  const [coursesResult, facultyAvailabilityResult, roomsResult, timeSlotsResult] = await Promise.all([
    supabase
      .from('courses')
      .select('*')
      .eq('department', department)
      .eq('semester', semester),
    supabase
      .from('faculty_availability')
      .select('*')
      .eq('available', true),
    supabase
      .from('rooms')
      .select('*'),
    supabase
      .from('time_slots')
      .select('*')
  ]);

  // Check for errors
  if (coursesResult.error) {
    logger.error('Error fetching courses:', coursesResult.error);
    return next(new AppError('Failed to fetch courses', 500));
  }

  if (facultyAvailabilityResult.error) {
    logger.error('Error fetching faculty availability:', facultyAvailabilityResult.error);
    return next(new AppError('Failed to fetch faculty availability', 500));
  }

  if (roomsResult.error) {
    logger.error('Error fetching rooms:', roomsResult.error);
    return next(new AppError('Failed to fetch rooms', 500));
  }

  if (timeSlotsResult.error) {
    logger.error('Error fetching time slots:', timeSlotsResult.error);
    return next(new AppError('Failed to fetch time slots', 500));
  }

  const courses = coursesResult.data;
  const facultyAvailability = facultyAvailabilityResult.data;
  const rooms = roomsResult.data;
  const timeSlots = timeSlotsResult.data;

  // Validate data
  if (courses.length === 0) {
    return next(new AppError('No courses found for this department and semester', 404));
  }

  if (rooms.length === 0) {
    return next(new AppError('No rooms available', 404));
  }

  if (timeSlots.length === 0) {
    return next(new AppError('No time slots defined', 404));
  }

  // Initialize timetable service
  const timetableService = new TimetableService(
    courses,
    facultyAvailability,
    rooms,
    timeSlots
  );

  // Generate timetable using constraint satisfaction and backtracking
  const generatedTimetable = timetableService.generate();

  if (!generatedTimetable || generatedTimetable.length === 0) {
    return next(new AppError('Failed to generate timetable. Constraints cannot be satisfied.', 400));
  }

  // Delete existing timetable for this department and semester
  await supabase
    .from('timetable')
    .delete()
    .eq('department', department)
    .eq('semester', semester);

  // Insert new timetable
  const timetableRecords = generatedTimetable.map(entry => ({
    course_id: entry.course_id,
    faculty_id: entry.faculty_id,
    room_id: entry.room_id,
    day: entry.day,
    time_slot: entry.time_slot,
    semester,
    department
  }));

  const { data: insertedData, error: insertError } = await supabase
    .from('timetable')
    .insert(timetableRecords)
    .select();

  if (insertError) {
    logger.error('Error inserting timetable:', insertError);
    return next(new AppError('Failed to save timetable', 500));
  }

  logger.info(`Timetable generated successfully for ${department} - Semester ${semester}`);

  res.status(201).json({
    success: true,
    message: 'Timetable generated successfully',
    data: {
      timetable: insertedData,
      stats: {
        total_classes: insertedData.length,
        courses_scheduled: new Set(insertedData.map(t => t.course_id)).size
      }
    }
  });
});

/**
 * @route   GET /api/timetable/:department/:semester
 * @desc    Get timetable for a department and semester using timetable_view
 * @access  Private
 */
const getTimetable = asyncHandler(async (req, res, next) => {
  const { department, semester } = req.params;

  logger.info(`Fetching timetable for ${department} - Semester ${semester}`);

  // Fetch from timetable_view directly
  const { data: viewData, error: viewError } = await supabase
    .from('timetable_view')
    .select('*')
    .eq('department', department)
    .eq('semester', parseInt(semester));

  if (viewError) {
    logger.error('Error fetching timetable_view:', JSON.stringify(viewError));
    return next(new AppError('Failed to fetch timetable', 500));
  }

  logger.info(`Found ${viewData.length} timetable entries from view`);

  if (viewData.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: { timetable: [] }
    });
  }

  // Transform the data to match expected frontend format
  const transformedData = viewData.map(item => ({
    id: item.id,
    day: item.day,
    semester: item.semester,
    department: item.department,
    // Add nested objects for frontend compatibility
    course: {
      course_name: item.course_name
    },
    faculty: {
      name: item.faculty_name,
      email: item.faculty_email
    },
    room: {
      room_name: item.room_name,
      capacity: item.capacity
    },
    time_slot_details: {
      day: item.day,
      start_time: item.start_time,
      end_time: item.end_time
    }
  }));

  logger.info(`Transformed ${transformedData.length} entries with data from view`);

  res.status(200).json({
    success: true,
    count: transformedData.length,
    data: { timetable: transformedData }
  });
});

/**
 * @route   GET /api/faculty/:id/timetable
 * @desc    Get timetable for a specific faculty using timetable_view
 * @access  Private
 */
const getFacultyTimetable = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { semester } = req.query;

  logger.info(`=== FACULTY TIMETABLE REQUEST ===`);
  logger.info(`Faculty ID: ${id}`);
  logger.info(`Semester filter: ${semester || 'none'}`);

  try {
    // Get timetable ID and faculty_id mapping first
    let timetableQuery = supabase
      .from('timetable')
      .select('id, faculty_id')
      .eq('faculty_id', id);

    if (semester) {
      timetableQuery = timetableQuery.eq('semester', parseInt(semester));
    }

    const { data: timetableIds, error: timetableError } = await timetableQuery;

    if (timetableError) {
      logger.error('Error fetching timetable IDs:', timetableError);
      return next(new AppError('Failed to fetch timetable', 500));
    }

    if (!timetableIds || timetableIds.length === 0) {
      logger.warn(`No timetable entries found for faculty_id: ${id}`);
      return res.status(200).json({
        success: true,
        count: 0,
        data: { timetable: [] }
      });
    }

    logger.info(`Found ${timetableIds.length} timetable entries for faculty ${id}`);

    // Now fetch from timetable_view using the IDs
    const ids = timetableIds.map(t => t.id);
    const { data: viewData, error: viewError } = await supabase
      .from('timetable_view')
      .select('*')
      .in('id', ids);

    if (viewError) {
      logger.error('Error fetching from timetable_view:', viewError);
      return next(new AppError('Failed to fetch timetable view', 500));
    }

    // Transform the data to match expected frontend format
    const transformedData = viewData.map(item => ({
      id: item.id,
      day: item.day,
      course_id: null, // Not in view, but keeping for compatibility
      faculty_id: id,
      room_id: null, // Not in view, but keeping for compatibility
      time_slot: null, // Not in view, but keeping for compatibility
      semester: item.semester,
      department: item.department,
      // Add nested objects for frontend compatibility
      courses: {
        course_name: item.course_name
      },
      course: {
        course_name: item.course_name
      },
      rooms: {
        room_name: item.room_name,
        capacity: item.capacity
      },
      room: {
        room_name: item.room_name,
        capacity: item.capacity
      },
      time_slots: {
        day: item.day,
        start_time: item.start_time,
        end_time: item.end_time
      },
      time_slot_details: {
        day: item.day,
        start_time: item.start_time,
        end_time: item.end_time
      },
      faculty_name: item.faculty_name,
      faculty_email: item.faculty_email
    }));

    logger.info(`Returning ${transformedData.length} entries from timetable_view`);
    logger.info(`Sample entry:`, JSON.stringify(transformedData[0], null, 2));

    res.status(200).json({
      success: true,
      count: transformedData.length,
      data: { timetable: transformedData }
    });
  } catch (error) {
    logger.error('Failed to fetch timetable:', error);
    return next(new AppError('Failed to fetch timetable', 500));
  }
});

/**
 * @route   DELETE /api/timetable/:department/:semester
 * @desc    Delete timetable for a department and semester
 * @access  Private (Admin only)
 */
const deleteTimetable = asyncHandler(async (req, res, next) => {
  const { department, semester } = req.params;

  const { error } = await supabase
    .from('timetable')
    .delete()
    .eq('department', department)
    .eq('semester', semester);

  if (error) {
    logger.error('Error deleting timetable:', error);
    return next(new AppError('Failed to delete timetable', 500));
  }

  logger.info(`Timetable deleted for ${department} - Semester ${semester}`);

  res.status(200).json({
    success: true,
    message: 'Timetable deleted successfully'
  });
});

module.exports = {
  generateTimetable,
  getTimetable,
  getFacultyTimetable,
  deleteTimetable
};
