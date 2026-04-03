-- Migration: Batch Practical Scheduling
-- Adds batches, batch_assignments tables and extends courses with rotation_group/course_type

-- 1. Extend courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'lecture'
  CHECK (course_type IN ('lecture', 'lab', 'practical', 'seminar'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rotation_group TEXT;

-- 2. Add batch_id to users (students)
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS semester INTEGER;

-- 3. Batches table
CREATE TABLE IF NOT EXISTS batches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(20) NOT NULL,
  department  TEXT NOT NULL,
  semester    INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (name, department, semester)
);

CREATE INDEX IF NOT EXISTS idx_batches_dept_sem ON batches(department, semester);

-- 4. Batch assignments table
CREATE TABLE IF NOT EXISTS batch_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id    UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  room_id     INTEGER REFERENCES rooms(id),
  day         TEXT NOT NULL,
  time_slot   INTEGER REFERENCES time_slots(id),
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  department  TEXT NOT NULL,
  semester    INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (batch_id, course_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_batch_assignments_batch ON batch_assignments(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_assignments_dept_sem ON batch_assignments(department, semester);
CREATE INDEX IF NOT EXISTS idx_batch_assignments_day_slot ON batch_assignments(day, time_slot);

-- Update timetable_view to expose time_slot FK (needed for batch assignment lookup)
CREATE OR REPLACE VIEW timetable_view AS
SELECT
    t.id,
    t.day,
    t.time_slot,
    ts.start_time,
    ts.end_time,
    c.course_name,
    c.course_type,
    c.department,
    c.semester,
    u.name  AS faculty_name,
    u.email AS faculty_email,
    r.room_name,
    r.capacity
FROM timetable t
JOIN courses    c  ON t.course_id  = c.id
JOIN users      u  ON t.faculty_id = u.id
JOIN rooms      r  ON t.room_id    = r.id
JOIN time_slots ts ON t.time_slot  = ts.id
ORDER BY c.department, c.semester, t.day, ts.start_time;

GRANT SELECT ON timetable_view TO authenticated;
