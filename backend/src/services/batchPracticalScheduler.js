const logger = require('../config/logger');

/**
 * BatchPracticalScheduler
 *
 * For every lab/practical slot in the timetable, all batches attend
 * simultaneously but each gets a DIFFERENT lab subject.
 *
 * Rotation (Latin-square, cyclic shift):
 *   N batches, N lab courses, N weeks
 *   Week w, Batch i → labCourses[(i + w) % N]
 *
 *   Week 1: B1→Physics Lab, B2→Chemistry Lab, B3→Computer Lab
 *   Week 2: B1→Chemistry Lab, B2→Computer Lab, B3→Physics Lab
 *   Week 3: B1→Computer Lab, B2→Physics Lab, B3→Chemistry Lab
 *
 * If there are more lab courses than batches, we pick N courses per slot
 * using a round-robin offset so different slots use different course subsets.
 */
class BatchPracticalScheduler {
  constructor(batches, labCourses, rooms, timeSlots, existingSchedule = []) {
    this.batches = batches;
    this.labCourses = labCourses;
    this.rooms = rooms;
    this.timeSlots = timeSlots;
    this.existingSchedule = existingSchedule;
  }

  generateBatchAssignments() {
    const assignments = [];
    const warnings = [];

    const N = this.batches.length;

    if (N === 0) {
      warnings.push('No batches defined — skipping batch practical scheduling');
      return { assignments, warnings };
    }

    if (this.labCourses.length === 0) {
      warnings.push('No lab/practical courses found');
      return { assignments, warnings };
    }

    // Find all lab timetable entries
    const labCourseIds = new Set(this.labCourses.map(c => String(c.id)));
    const labEntries = this.existingSchedule.filter(e => labCourseIds.has(String(e.course_id)));

    if (labEntries.length === 0) {
      warnings.push('No lab/practical courses were scheduled in the timetable');
      return { assignments, warnings };
    }

    // Group lab timetable entries by day, since the generator creates a contiguous
    // 2-hour lab block (normally 2 adjacent time slots) for each lab scheduled on a day.
    const labBlocksByDay = {};
    for (const entry of labEntries) {
      if (!labBlocksByDay[entry.day]) {
        labBlocksByDay[entry.day] = [];
      }
      labBlocksByDay[entry.day].push(entry);
    }

    const days = Object.keys(labBlocksByDay).sort((a, b) => {
      const order = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
      return (order[a] || 99) - (order[b] || 99);
    });

    const totalCourses = this.labCourses.length;

    days.forEach((day, dayIdx) => {
      const blockEntries = labBlocksByDay[day]; // array of time slots for this day's lab block

      // Assign rooms — one distinct room per batch
      const roomMap = this._assignRooms(day, blockEntries[0].time_slot, N);

      for (let i = 0; i < N; i++) {
        // Shift course by dayIdx to rotate over the week's lab days
        const course = this.labCourses[(i + dayIdx) % totalCourses];
        const batch = this.batches[i];

        // Apply ONLY to the FIRST time slot of the 2-hour block
        // This is strictly required because the database has a unique constraint:
        // "batch_assignments_batch_id_course_id_week_number_key"
        // meaning a batch cannot have the same course inserted twice in the same week.
        const entry = blockEntries[0];
        
        assignments.push({
          batch_id: batch.id,
          course_id: course.id,
          room_id: roomMap[i] || null,
          day: entry.day,
          time_slot: entry.time_slot,
          week_number: 1, // week 1
          department: batch.department,
          semester: batch.semester,
        });
      }

      logger.info(
        `Lab Block on ${day} (${blockEntries.length} slots): ` +
        `assigned ${N} batches across lab subjects. ` +
        `Rooms: ${Object.entries(roomMap).map(([idx, rid]) => `Batch ${this.batches[idx].name}->RoomID ${rid}`).join(', ')}`
      );
    });

    return { assignments, warnings };
  }

  /**
   * Assign one distinct room per batch for a given slot.
   * Simply fetches all lab rooms, shuffles them, and distributes them to the batches.
   */
  _assignRooms(day, timeSlot, N) {
    const labRooms = this.rooms.filter(r => this._isLabRoom(r));
    const allRooms = this.rooms;

    // Use lab rooms if we have enough, otherwise use all rooms
    let pool = labRooms.length >= N ? [...labRooms] : [...allRooms];
    
    // Shuffle the pool to get "random" assignments as requested
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const roomMap = {};
    for (let i = 0; i < N; i++) {
       // Using pool[i] ensures we get unique rooms as long as we have at least N rooms
       roomMap[i] = pool[i % pool.length]?.id || null;
    }
    return roomMap;
  }

  _isLabRoom(room) {
    return (
      /lab/i.test(room.room_name || '') ||
      room.room_type === 'lab' ||
      room.type === 'lab'
    );
  }
}

module.exports = BatchPracticalScheduler;
