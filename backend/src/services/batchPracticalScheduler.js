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

    // Deduplicate slots — each unique (day, time_slot) is one practical window
    const seen = new Set();
    const uniqueSlots = [];
    for (const entry of labEntries) {
      const key = `${entry.day}_${entry.time_slot}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSlots.push({ day: entry.day, time_slot: entry.time_slot });
      }
    }

    const totalCourses = this.labCourses.length;

    uniqueSlots.forEach((slot, slotIdx) => {
      // Pick N courses for this slot using a round-robin offset across slots
      // so different slots use different course subsets
      const courseSubset = [];
      for (let i = 0; i < N; i++) {
        courseSubset.push(this.labCourses[(slotIdx * N + i) % totalCourses]);
      }

      // Assign rooms — one distinct room per batch
      const roomMap = this._assignRooms(slot.day, slot.time_slot, N);

      // Build N weeks of rotation across the N courses in this slot's subset
      for (let week = 0; week < N; week++) {
        for (let i = 0; i < N; i++) {
          // Latin-square: batch i in week w gets courseSubset[(i + w) % N]
          // This guarantees every batch gets a DIFFERENT course each week
          const course = courseSubset[(i + week) % N];
          const batch = this.batches[i];

          assignments.push({
            batch_id: batch.id,
            course_id: course.id,
            room_id: roomMap[i] || null,
            day: slot.day,
            time_slot: slot.time_slot,
            week_number: week + 1,
            department: batch.department,
            semester: batch.semester,
          });
        }
      }

      logger.info(
        `Slot ${slot.day}/${slot.time_slot}: ` +
        `courses=[${courseSubset.map(c => c.course_name).join(', ')}] ` +
        `→ ${N} batches × ${N} weeks`
      );
    });

    return { assignments, warnings };
  }

  /**
   * Assign one distinct room per batch for a given slot.
   * Returns array[batchIndex] → room_id
   */
  _assignRooms(day, timeSlot, N) {
    const labRooms = this.rooms.filter(r => this._isLabRoom(r));
    const allRooms = labRooms.length > 0 ? labRooms : this.rooms;

    // Rooms already occupied in this slot by the main timetable
    const occupiedRooms = new Set(
      this.existingSchedule
        .filter(e => e.day === day && String(e.time_slot) === String(timeSlot))
        .map(e => String(e.room_id))
    );

    const freeRooms = allRooms.filter(r => !occupiedRooms.has(String(r.id)));
    const pool = freeRooms.length >= N ? freeRooms : allRooms; // fallback if not enough free

    const roomMap = {};
    for (let i = 0; i < N; i++) {
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
