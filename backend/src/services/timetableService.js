const logger = require('../config/logger');

/**
 * TimetableService - Implements AI-based timetable generation using:
 * 1. Greedy Algorithm for initial assignment
 * 2. Backtracking for conflict resolution
 * 3. Constraint Satisfaction Problem (CSP) approach
 * 
 * Constraints:
 * - No overlapping classes for faculty
 * - No double booking of rooms
 * - Faculty availability must be respected
 * - Weekly hours must be fulfilled
 * - Balanced faculty workload
 */
class TimetableService {
  constructor(courses, facultyAvailability, rooms, timeSlots) {
    this.courses = courses;
    this.facultyAvailability = facultyAvailability;
    this.rooms = rooms;
    this.timeSlots = timeSlots;
    
    // Sort time slots by day and time for consistent processing
    this.sortedTimeSlots = this.timeSlots.sort((a, b) => {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayCompare = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayCompare !== 0) return dayCompare;
      return a.start_time.localeCompare(b.start_time);
    });
    
    // Initialize tracking structures
    this.schedule = [];
    this.facultySchedule = new Map(); // faculty_id -> Set of {day, time_slot}
    this.roomSchedule = new Map(); // room_id -> Set of {day, time_slot}
    this.courseSchedule = new Map(); // course_id -> count of scheduled classes
    
    // Build faculty availability index for quick lookup
    this.facultyAvailabilityIndex = new Map();
    this.facultyAvailability.forEach(avail => {
      const key = `${avail.faculty_id}_${avail.day}_${avail.time_slot}`;
      this.facultyAvailabilityIndex.set(key, avail.available);
    });
  }

  /**
   * Main generation method - orchestrates the timetable generation
   * @returns {Array} Generated timetable entries
   */
  generate() {
    logger.info('Starting timetable generation...');
    
    // Step 1: Calculate required classes for each course
    const courseRequirements = this.calculateCourseRequirements();
    
    // Step 2: Try to generate timetable using greedy + backtracking
    const success = this.generateWithBacktracking(courseRequirements, 0);
    
    if (!success) {
      logger.error('Failed to generate timetable - constraints cannot be satisfied');
      return [];
    }
    
    logger.info(`Timetable generated successfully with ${this.schedule.length} classes`);
    return this.schedule;
  }

  /**
   * Calculate how many classes each course needs based on weekly hours
   * Assumes each class is ~1 hour
   */
  calculateCourseRequirements() {
    const requirements = [];
    
    this.courses.forEach(course => {
      const classesNeeded = course.weekly_hours || 3; // Default to 3 if not specified
      requirements.push({
        course,
        classesNeeded,
        classesScheduled: 0
      });
    });
    
    return requirements;
  }

  /**
   * Recursive backtracking algorithm to generate timetable
   * @param {Array} courseRequirements - Array of course requirements
   * @param {Number} index - Current course index being processed
   * @returns {Boolean} True if scheduling successful
   */
  generateWithBacktracking(courseRequirements, index) {
    // Base case: All courses have been scheduled
    if (index >= courseRequirements.length) {
      return true;
    }
    
    const requirement = courseRequirements[index];
    const { course, classesNeeded } = requirement;
    
    // Try to schedule all required classes for this course
    const assignments = [];
    
    for (let classNum = 0; classNum < classesNeeded; classNum++) {
      const assignment = this.findBestSlot(course, assignments);
      
      if (!assignment) {
        // Backtrack: Remove all assignments for this course
        this.rollbackAssignments(assignments);
        return false;
      }
      
      // Add assignment
      assignments.push(assignment);
      this.applyAssignment(assignment);
    }
    
    // Move to next course
    if (this.generateWithBacktracking(courseRequirements, index + 1)) {
      return true;
    }
    
    // Backtrack if next course fails
    this.rollbackAssignments(assignments);
    return false;
  }

  /**
   * Find the best available slot for a course using greedy approach
   * @param {Object} course - Course to schedule
   * @param {Array} existingAssignments - Already scheduled classes for this course
   * @returns {Object|null} Best assignment or null if none found
   */
  findBestSlot(course, existingAssignments) {
    let bestAssignment = null;
    let bestScore = -1;
    
    // Try each time slot
    for (const timeSlot of this.sortedTimeSlots) {
      // Try each room
      for (const room of this.rooms) {
        // Check if this slot is valid
        if (this.isValidAssignment(course, room, timeSlot, existingAssignments)) {
          // Calculate score for this assignment (greedy heuristic)
          const score = this.calculateAssignmentScore(course, room, timeSlot, existingAssignments);
          
          if (score > bestScore) {
            bestScore = score;
            bestAssignment = {
              course_id: course.id,
              faculty_id: course.faculty_id,
              room_id: room.id,
              day: timeSlot.day,
              time_slot: timeSlot.id
            };
          }
        }
      }
    }
    
    return bestAssignment;
  }

  /**
   * Check if an assignment satisfies all constraints
   */
  isValidAssignment(course, room, timeSlot, existingAssignments) {
    const facultyId = course.faculty_id;
    const roomId = room.id;
    const day = timeSlot.day;
    const slotId = timeSlot.id;
    
    // Constraint 1: Check faculty availability
    const availKey = `${facultyId}_${day}_${slotId}`;
    if (!this.facultyAvailabilityIndex.get(availKey)) {
      // If not explicitly set as available, check if there's any entry
      // If no entry exists, we assume availability (open availability)
      const hasAvailabilityData = Array.from(this.facultyAvailabilityIndex.keys())
        .some(key => key.startsWith(`${facultyId}_`));
      
      if (hasAvailabilityData && !this.facultyAvailabilityIndex.get(availKey)) {
        return false; // Faculty has availability data but not available at this time
      }
    }
    
    // Constraint 2: No overlapping classes for faculty
    if (!this.facultySchedule.has(facultyId)) {
      this.facultySchedule.set(facultyId, new Set());
    }
    const facultySlotKey = `${day}_${slotId}`;
    if (this.facultySchedule.get(facultyId).has(facultySlotKey)) {
      return false;
    }
    
    // Constraint 3: No double booking of rooms
    if (!this.roomSchedule.has(roomId)) {
      this.roomSchedule.set(roomId, new Set());
    }
    const roomSlotKey = `${day}_${slotId}`;
    if (this.roomSchedule.get(roomId).has(roomSlotKey)) {
      return false;
    }
    
    // Constraint 4: Avoid scheduling same course in consecutive slots on same day
    const consecutiveSlot = existingAssignments.find(
      a => a.day === day && this.areConsecutiveSlots(a.time_slot, slotId)
    );
    if (consecutiveSlot) {
      return false;
    }
    
    // Constraint 5: Try to distribute classes throughout the week
    const sameDay = existingAssignments.filter(a => a.day === day).length;
    if (sameDay >= 2) {
      return false; // Max 2 classes per day for same course
    }
    
    return true;
  }

  /**
   * Calculate a score for an assignment (higher is better)
   * Used by greedy algorithm to make better choices
   */
  calculateAssignmentScore(course, room, timeSlot, existingAssignments) {
    let score = 100;
    
    // Prefer spreading classes across different days
    const daysUsed = new Set(existingAssignments.map(a => a.day));
    if (!daysUsed.has(timeSlot.day)) {
      score += 50; // Bonus for using a new day
    }
    
    // Prefer earlier time slots (morning classes)
    const hour = parseInt(timeSlot.start_time.split(':')[0]);
    if (hour >= 8 && hour <= 10) {
      score += 30;
    } else if (hour >= 11 && hour <= 13) {
      score += 20;
    }
    
    // Prefer rooms with capacity closer to expected class size (if we had class size data)
    // For now, prefer smaller rooms to save larger ones for bigger classes
    score -= room.capacity * 0.1;
    
    // Check faculty workload balance
    const facultyId = course.faculty_id;
    const currentWorkload = this.courseSchedule.get(facultyId) || 0;
    score -= currentWorkload * 5; // Penalty for overloading faculty
    
    return score;
  }

  /**
   * Check if two time slots are consecutive
   */
  areConsecutiveSlots(slotId1, slotId2) {
    const slot1 = this.timeSlots.find(s => s.id === slotId1);
    const slot2 = this.timeSlots.find(s => s.id === slotId2);
    
    if (!slot1 || !slot2) return false;
    
    // Parse times and check if they're adjacent
    const end1 = this.parseTime(slot1.end_time);
    const start2 = this.parseTime(slot2.start_time);
    
    // Consider slots consecutive if end of one is within 15 minutes of start of other
    const diff = Math.abs(start2 - end1);
    return diff <= 15;
  }

  /**
   * Parse time string to minutes
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Apply an assignment to the schedule
   */
  applyAssignment(assignment) {
    this.schedule.push(assignment);
    
    const { faculty_id, room_id, day, time_slot } = assignment;
    
    // Update faculty schedule
    if (!this.facultySchedule.has(faculty_id)) {
      this.facultySchedule.set(faculty_id, new Set());
    }
    this.facultySchedule.get(faculty_id).add(`${day}_${time_slot}`);
    
    // Update room schedule
    if (!this.roomSchedule.has(room_id)) {
      this.roomSchedule.set(room_id, new Set());
    }
    this.roomSchedule.get(room_id).add(`${day}_${time_slot}`);
    
    // Update course schedule count
    const currentCount = this.courseSchedule.get(faculty_id) || 0;
    this.courseSchedule.set(faculty_id, currentCount + 1);
  }

  /**
   * Rollback multiple assignments (backtracking)
   */
  rollbackAssignments(assignments) {
    assignments.forEach(assignment => {
      // Remove from schedule
      const index = this.schedule.findIndex(s => 
        s.course_id === assignment.course_id &&
        s.day === assignment.day &&
        s.time_slot === assignment.time_slot
      );
      if (index > -1) {
        this.schedule.splice(index, 1);
      }
      
      const { faculty_id, room_id, day, time_slot } = assignment;
      
      // Update faculty schedule
      if (this.facultySchedule.has(faculty_id)) {
        this.facultySchedule.get(faculty_id).delete(`${day}_${time_slot}`);
      }
      
      // Update room schedule
      if (this.roomSchedule.has(room_id)) {
        this.roomSchedule.get(room_id).delete(`${day}_${time_slot}`);
      }
      
      // Update course schedule count
      const currentCount = this.courseSchedule.get(faculty_id) || 0;
      this.courseSchedule.set(faculty_id, Math.max(0, currentCount - 1));
    });
  }
}

module.exports = TimetableService;
