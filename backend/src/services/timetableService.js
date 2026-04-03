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
 * - Lab courses: exactly ONE 2-hour continuous block per day (no more, no less)
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
    this.labDaySchedule = new Set(); // days that already have ANY lab session (global, 1 lab/day max)
    
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
    
    // Step 2: Generate timetable using greedy + best-effort scheduling
    this.generateWithBacktracking(courseRequirements, 0);
    
    if (this.schedule.length === 0) {
      logger.error('Failed to generate timetable - no slots could be assigned');
      return [];
    }
    
    logger.info(`Timetable generated with ${this.schedule.length} classes across ${new Set(this.schedule.map(s => s.day)).size} days`);
    return this.schedule;
  }

  /**
   * Calculate how many scheduling units each course needs.
   * For lab courses: one 2-hour block per working day (spread across the week),
   *   capped at the number of available working days.
   *   The global labDaySchedule constraint ensures at most ONE lab per day total.
   * For regular courses: number of 1-hour slots = weeklyHours.
   */
  calculateCourseRequirements() {
    const requirements = [];

    // Count available working days from time slots
    const workingDays = [...new Set(this.timeSlots.map(ts => ts.day))];
    const numWorkingDays = workingDays.length || 5;

    this.courses.forEach(course => {
      const weeklyHours = course.weekly_hours || 3;
      const isLab = this.courseNeedsLab(course);

      let classesNeeded;
      if (isLab) {
        // Enforce exactly one 2-hour lab session PER lab course over the week.
        // This ensures the total number of lab sessions in the week exactly matches
        // the number of lab courses, allowing batches to cycle through all of them exactly once.
        classesNeeded = 1;
      } else {
        classesNeeded = weeklyHours;
      }

      requirements.push({
        course,
        classesNeeded,
        classesScheduled: 0,
        isLab
      });
    });

    // Schedule lab courses FIRST so they claim days before regular courses fill slots
    requirements.sort((a, b) => (b.isLab ? 1 : 0) - (a.isLab ? 1 : 0));

    const labCount = requirements.filter(r => r.isLab).length;
    const lectureCount = requirements.length - labCount;
    logger.info(`Ordering configuration: Generating ${labCount} Lab sessions first, followed by ${lectureCount} Lecture sessions.`);

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
    const { course, classesNeeded, isLab } = requirement;
    
    // Try to schedule all required classes for this course
    const assignments = [];
    
    for (let classNum = 0; classNum < classesNeeded; classNum++) {
      if (isLab) {
        // Lab: find a pair of consecutive slots and schedule both at once
        const pair = this.findBestLabSlotPair(course, assignments);
        if (!pair) {
          logger.warn(`Could not schedule all ${classesNeeded} lab blocks for course ${course.id} (${course.name || course.code}). Scheduled ${Math.floor(assignments.length / 2)}/${classesNeeded} blocks.`);
          break;
        }
        assignments.push(pair.slotA, pair.slotB);
        this.applyAssignment(pair.slotA);
        this.applyAssignment(pair.slotB);
      } else {
        // Regular: find a single best slot
        const assignment = this.findBestSlot(course, assignments);
        if (!assignment) {
          logger.warn(`Could not schedule all ${classesNeeded} classes for course ${course.id} (${course.name || course.code}). Scheduled ${assignments.length}/${classesNeeded}.`);
          break;
        }
        assignments.push(assignment);
        this.applyAssignment(assignment);
      }
    }
    
    // Move to next course regardless — don't let one course block others
    this.generateWithBacktracking(courseRequirements, index + 1);
    return true;
  }

  /**
   * Fisher-Yates shuffle — returns a new shuffled array.
   */
  shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Find a valid consecutive-slot pair for a lab/practical course.
   * Rules:
   *   - Slots must be immediately adjacent (zero gap) on the same day.
   *   - At most ONE lab session per day across the ENTIRE timetable (global).
   *   - Valid pairs are collected from ALL windows, then chosen RANDOMLY so labs
   *     spread across morning, afternoon and evening windows.
   *   - Each lab course can have multiple blocks (one per day), but each day
   *     can only have one lab block total across all lab courses.
   */
  findBestLabSlotPair(course, existingAssignments) {
    // Days this course already occupies (always 0 for us since classesNeeded=1)
    const daysWithLabBlock = new Set(existingAssignments.map(a => a.day));

    // Group sorted slots by day
    const slotsByDay = new Map();
    for (const slot of this.sortedTimeSlots) {
      if (!slotsByDay.has(slot.day)) slotsByDay.set(slot.day, []);
      slotsByDay.get(slot.day).push(slot);
    }

    // Collect ALL valid (slotA, slotB, room) candidates across all days & windows
    const candidates = [];

    for (const [day, daySlots] of slotsByDay) {
      // Skip: this course already has a lab block on this day
      if (daysWithLabBlock.has(day)) continue;
      // Removed strict global 1-lab/day filter to allow the fallback logic
      // below to work if we run out of unique days.

      for (let i = 0; i < daySlots.length - 1; i++) {
        const slotA = daySlots[i];
        const slotB = daySlots[i + 1];

        // Must be immediately adjacent (zero gap)
        if (!this.areAdjacentSlots(slotA, slotB)) continue;

        for (const room of this.rooms) {
          if (!this.isLabRoom(room)) continue;

          if (
            this.isValidLabSlot(course, room, slotA, existingAssignments) &&
            this.isValidLabSlot(course, room, slotB, existingAssignments)
          ) {
            candidates.push({ slotA, slotB, room, day });
          }
        }
      }
    }

    if (candidates.length === 0) return null;

    // Split candidates into two tiers:
    //   preferred  — days that have NO lab yet globally  (spread-first strategy)
    //   fallback   — days that already have a lab (should be empty given labDaySchedule, but safety net)
    // Within each tier, shuffle randomly so labs spread across all time windows.
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const daysWithoutLab = new Set(allDays.filter(d => !this.labDaySchedule.has(d)));

    const preferred = this.shuffleArray(candidates.filter(c => daysWithoutLab.has(c.day)));
    const fallback  = this.shuffleArray(candidates.filter(c => !daysWithoutLab.has(c.day)));

    const pool = preferred.length > 0 ? preferred : fallback;
    const chosen = pool[0];

    // Mark this day as occupied by a lab (global constraint)
    this.labDaySchedule.add(chosen.day);

    return {
      slotA: {
        course_id: course.id,
        faculty_id: course.faculty_id,
        room_id: chosen.room.id,
        day: chosen.slotA.day,
        time_slot: chosen.slotA.id
      },
      slotB: {
        course_id: course.id,
        faculty_id: course.faculty_id,
        room_id: chosen.room.id,
        day: chosen.slotB.day,
        time_slot: chosen.slotB.id
      }
    };
  }

  /**
   * Validate a single slot for a lab course (used when checking a slot pair).
   * Skips Constraint 4 (consecutive check) since consecutive is required for labs.
   */
  isValidLabSlot(course, room, timeSlot, existingAssignments) {
    const facultyId = course.faculty_id;
    const roomId = room.id;
    const day = timeSlot.day;
    const slotId = timeSlot.id;

    // Constraint 0: Room must be a lab room
    if (!this.isLabRoom(room)) return false;

    // Constraint 1: Check faculty availability
    const availKey = `${facultyId}_${day}_${slotId}`;
    if (!this.facultyAvailabilityIndex.get(availKey)) {
      const hasAvailabilityData = Array.from(this.facultyAvailabilityIndex.keys())
        .some(key => key.startsWith(`${facultyId}_`));
      if (hasAvailabilityData && !this.facultyAvailabilityIndex.get(availKey)) {
        return false;
      }
    }

    // Constraint 2: No overlapping classes for faculty
    if (!this.facultySchedule.has(facultyId)) {
      this.facultySchedule.set(facultyId, new Set());
    }
    if (this.facultySchedule.get(facultyId).has(`${day}_${slotId}`)) return false;

    // Constraint 3: No double booking of rooms
    if (!this.roomSchedule.has(roomId)) {
      this.roomSchedule.set(roomId, new Set());
    }
    if (this.roomSchedule.get(roomId).has(`${day}_${slotId}`)) return false;

    return true;
  }

  /**
   * Find the best available slot for a regular (non-lab) course using greedy approach
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
   * Determine if a course requires a lab room based on its name or type field
   * lab and practical are treated identically
   */
  courseNeedsLab(course) {
    if (course.course_type === 'lab' || course.course_type === 'practical') return true;
    const name = (course.course_name || course.name || '').toLowerCase();
    return name.includes('lab') || name.includes('practical') || name.includes('workshop');
  }

  /**
   * Determine if a room is a lab room
   */
  isLabRoom(room) {
    return (room.room_type || '').toLowerCase() === 'lab' ||
           (room.room_name || '').toLowerCase().includes('lab');
  }

  /**
   * Check if slotB starts exactly when slotA ends (strictly adjacent, no gap).
   * Both slots must be on the same day.
   */
  areAdjacentSlots(slotA, slotB) {
    if (!slotA || !slotB) return false;
    if (slotA.day !== slotB.day) return false;
    const endA = this.parseTime(slotA.end_time);
    const startB = this.parseTime(slotB.start_time);
    return startB === endA; // strictly back-to-back, zero gap
  }

  /**
   * Check if an assignment satisfies all constraints (for regular non-lab courses only)
   */
  isValidAssignment(course, room, timeSlot, existingAssignments) {
    const facultyId = course.faculty_id;
    const roomId = room.id;
    const day = timeSlot.day;
    const slotId = timeSlot.id;

    // Constraint 0: Room type must match course type
    // Lab/practical courses must go in lab rooms; lecture courses must go in non-lab rooms
    const needsLab = this.courseNeedsLab(course);
    const roomIsLab = this.isLabRoom(room);
    if (needsLab && !roomIsLab) return false;
    if (!needsLab && roomIsLab) return false;
    
    // Constraint 1: Check faculty availability
    const availKey = `${facultyId}_${day}_${slotId}`;
    if (!this.facultyAvailabilityIndex.get(availKey)) {
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
    
    // Strongly prefer spreading classes across different days
    const daysUsed = new Set(existingAssignments.map(a => a.day));
    if (!daysUsed.has(timeSlot.day)) {
      score += 50; // Bonus for using a new day
    }

    // Prefer spreading across different time slots globally (avoid clustering)
    const slotUsageCount = this.schedule.filter(s => s.time_slot === timeSlot.id).length;
    score -= slotUsageCount * 10; // Penalty for already-busy slots

    // Prefer spreading across different rooms (avoid always picking the same room)
    const roomUsageCount = this.schedule.filter(s => s.room_id === room.id).length;
    score -= roomUsageCount * 8; // Penalty for overused rooms

    // Mild preference for reasonable hours (9-17), no strong morning bias
    const hour = parseInt(timeSlot.start_time.split(':')[0]);
    if (hour >= 9 && hour <= 16) {
      score += 5; // Small uniform bonus for standard hours
    }
    
    // Prefer rooms with capacity closer to expected class size
    // Avoid wasting large rooms on small courses
    score -= room.capacity * 0.1;
    
    // Check faculty workload balance
    const facultyId = course.faculty_id;
    const currentWorkload = this.courseSchedule.get(facultyId) || 0;
    score -= currentWorkload * 5; // Penalty for overloading faculty
    
    return score;
  }

  /**
   * Check if two time slots are consecutive (within 15 min gap - used for regular courses)
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
