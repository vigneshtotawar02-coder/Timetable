const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * @route   GET /api/analytics/faculty-workload
 * @desc    Get faculty workload analytics
 * @access  Private (Admin)
 */
const getFacultyWorkload = asyncHandler(async (req, res, next) => {
  const { department, semester } = req.query;

  // Build query to get timetable with course details
  let timetableQuery = supabase
    .from('timetable')
    .select(`
      faculty_id,
      course:courses(id, course_name, weekly_hours)
    `);

  if (department) {
    timetableQuery = timetableQuery.eq('department', department);
  }

  if (semester) {
    timetableQuery = timetableQuery.eq('semester', semester);
  }

  const { data: timetableData, error: timetableError } = await timetableQuery;

  if (timetableError) {
    logger.error('Error fetching timetable data:', timetableError);
    return next(new AppError('Failed to fetch timetable data', 500));
  }

  // Get all faculty members
  let facultyQuery = supabase
    .from('users')
    .select('id, name, email, department')
    .eq('role', 'faculty');

  if (department) {
    facultyQuery = facultyQuery.eq('department', department);
  }

  const { data: facultyData, error: facultyError } = await facultyQuery;

  if (facultyError) {
    logger.error('Error fetching faculty data:', facultyError);
    return next(new AppError('Failed to fetch faculty data', 500));
  }

  // Calculate workload for each faculty
  const workloadMap = new Map();

  // Initialize all faculty with zero workload
  facultyData.forEach(faculty => {
    workloadMap.set(faculty.id, {
      faculty_id: faculty.id,
      faculty_name: faculty.name,
      faculty_email: faculty.email,
      department: faculty.department,
      total_classes: 0,
      total_hours: 0,
      courses: []
    });
  });

  // Count classes and hours for each faculty
  timetableData.forEach(entry => {
    if (workloadMap.has(entry.faculty_id)) {
      const workload = workloadMap.get(entry.faculty_id);
      workload.total_classes += 1;
      
      // Track unique courses
      if (!workload.courses.find(c => c.id === entry.course.id)) {
        workload.courses.push({
          id: entry.course.id,
          name: entry.course.course_name,
          weekly_hours: entry.course.weekly_hours
        });
        workload.total_hours += entry.course.weekly_hours || 0;
      }
    }
  });

  // Convert map to array and calculate statistics
  const workloadArray = Array.from(workloadMap.values());
  
  const stats = {
    total_faculty: workloadArray.length,
    average_classes: workloadArray.length > 0 
      ? (workloadArray.reduce((sum, w) => sum + w.total_classes, 0) / workloadArray.length).toFixed(2)
      : 0,
    average_hours: workloadArray.length > 0
      ? (workloadArray.reduce((sum, w) => sum + w.total_hours, 0) / workloadArray.length).toFixed(2)
      : 0,
    max_workload: workloadArray.length > 0
      ? Math.max(...workloadArray.map(w => w.total_classes))
      : 0,
    min_workload: workloadArray.length > 0
      ? Math.min(...workloadArray.map(w => w.total_classes))
      : 0
  };

  res.status(200).json({
    success: true,
    data: {
      workload: workloadArray.sort((a, b) => b.total_classes - a.total_classes),
      statistics: stats
    }
  });
});

/**
 * @route   GET /api/analytics/room-utilization
 * @desc    Get room utilization analytics
 * @access  Private (Admin)
 */
const getRoomUtilization = asyncHandler(async (req, res, next) => {
  const { department, semester } = req.query;

  // Get all rooms
  const { data: roomsData, error: roomsError } = await supabase
    .from('rooms')
    .select('*');

  if (roomsError) {
    logger.error('Error fetching rooms:', roomsError);
    return next(new AppError('Failed to fetch rooms data', 500));
  }

  // Get timetable data
  let timetableQuery = supabase
    .from('timetable')
    .select('room_id, day, time_slot');

  if (department) {
    timetableQuery = timetableQuery.eq('department', department);
  }

  if (semester) {
    timetableQuery = timetableQuery.eq('semester', semester);
  }

  const { data: timetableData, error: timetableError } = await timetableQuery;

  if (timetableError) {
    logger.error('Error fetching timetable data:', timetableError);
    return next(new AppError('Failed to fetch timetable data', 500));
  }

  // Get total available time slots
  const { data: timeSlotsData, error: timeSlotsError } = await supabase
    .from('time_slots')
    .select('id');

  if (timeSlotsError) {
    logger.error('Error fetching time slots:', timeSlotsError);
    return next(new AppError('Failed to fetch time slots data', 500));
  }

  const uniqueDays = new Set(timetableData.map(t => t.day));
  const totalSlotsPerRoom = timeSlotsData.length * (uniqueDays.size || 5); // Default to 5 days if no data

  // Calculate utilization for each room
  const utilizationMap = new Map();

  // Initialize all rooms
  roomsData.forEach(room => {
    utilizationMap.set(room.id, {
      room_id: room.id,
      room_name: room.room_name,
      capacity: room.capacity,
      total_slots: totalSlotsPerRoom,
      used_slots: 0,
      utilization_percentage: 0
    });
  });

  // Count used slots for each room
  timetableData.forEach(entry => {
    if (utilizationMap.has(entry.room_id)) {
      const utilization = utilizationMap.get(entry.room_id);
      utilization.used_slots += 1;
    }
  });

  // Calculate utilization percentage
  utilizationMap.forEach(utilization => {
    utilization.utilization_percentage = totalSlotsPerRoom > 0
      ? ((utilization.used_slots / utilization.total_slots) * 100).toFixed(2)
      : 0;
  });

  const utilizationArray = Array.from(utilizationMap.values());

  const stats = {
    total_rooms: utilizationArray.length,
    average_utilization: utilizationArray.length > 0
      ? (utilizationArray.reduce((sum, u) => sum + parseFloat(u.utilization_percentage), 0) / utilizationArray.length).toFixed(2)
      : 0,
    fully_utilized_rooms: utilizationArray.filter(u => parseFloat(u.utilization_percentage) >= 90).length,
    underutilized_rooms: utilizationArray.filter(u => parseFloat(u.utilization_percentage) < 50).length
  };

  res.status(200).json({
    success: true,
    data: {
      utilization: utilizationArray.sort((a, b) => b.utilization_percentage - a.utilization_percentage),
      statistics: stats
    }
  });
});

/**
 * @route   GET /api/analytics/department-overview
 * @desc    Get department overview analytics
 * @access  Private (Admin)
 */
const getDepartmentOverview = asyncHandler(async (req, res, next) => {
  const { department } = req.query;

  let coursesQuery = supabase.from('courses').select('department');
  let usersQuery = supabase.from('users').select('department, role');
  let timetableQuery = supabase.from('timetable').select('department, semester');

  if (department) {
    coursesQuery = coursesQuery.eq('department', department);
    usersQuery = usersQuery.eq('department', department);
    timetableQuery = timetableQuery.eq('department', department);
  }

  const [coursesResult, usersResult, timetableResult] = await Promise.all([
    coursesQuery,
    usersQuery,
    timetableQuery
  ]);

  if (coursesResult.error || usersResult.error || timetableResult.error) {
    logger.error('Error fetching overview data');
    return next(new AppError('Failed to fetch overview data', 500));
  }

  // Group data by department
  const departmentStats = {};

  coursesResult.data.forEach(course => {
    if (!departmentStats[course.department]) {
      departmentStats[course.department] = {
        department: course.department,
        total_courses: 0,
        total_faculty: 0,
        total_students: 0,
        total_classes_scheduled: 0
      };
    }
    departmentStats[course.department].total_courses += 1;
  });

  usersResult.data.forEach(user => {
    if (departmentStats[user.department]) {
      if (user.role === 'faculty') {
        departmentStats[user.department].total_faculty += 1;
      } else if (user.role === 'student') {
        departmentStats[user.department].total_students += 1;
      }
    }
  });

  timetableResult.data.forEach(entry => {
    if (departmentStats[entry.department]) {
      departmentStats[entry.department].total_classes_scheduled += 1;
    }
  });

  const overview = Object.values(departmentStats);

  res.status(200).json({
    success: true,
    count: overview.length,
    data: { overview }
  });
});

module.exports = {
  getFacultyWorkload,
  getRoomUtilization,
  getDepartmentOverview
};
