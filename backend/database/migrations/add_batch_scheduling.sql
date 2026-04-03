-- Migration: Add batch-based practical scheduling support
-- Requirements: 9.1, 9.2, 9.3, 9.4, 9.5

-- ============================================================
-- 1. New table: batches
-- Stores named student subdivisions per department/semester
-- ============================================================
CREATE TABLE IF NOT EXISTS batches (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(20) NOT NULL,
    department  TEXT NOT NULL,
    semester    INTEGER NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_batch_name_dept_semester UNIQUE (name, department, semester)
);

CREATE INDEX IF NOT EXISTS idx_batches_department_semester ON batches(department, semester);

-- ============================================================
-- 2. New table: batch_assignments
-- Links a batch to a practical course for a specific slot/week
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_assignments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id    UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    room_id     INTEGER NOT NULL REFERENCES rooms(id),
    day         TEXT NOT NULL,
    time_slot   INTEGER NOT NULL REFERENCES time_slots(id),
    week_number INTEGER NOT NULL,
    department  TEXT NOT NULL,
    semester    INTEGER NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_batch_course_week UNIQUE (batch_id, course_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_batch_assignments_batch_id ON batch_assignments(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_assignments_dept_semester ON batch_assignments(department, semester);
CREATE INDEX IF NOT EXISTS idx_batch_assignments_day_slot ON batch_assignments(day, time_slot);

-- ============================================================
-- 3. Extend courses table
-- Add rotation_group and course_type for practical scheduling
-- ============================================================
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rotation_group TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'lecture';

-- ============================================================
-- 4. Extend users table
-- Add batch_id for student batch assignment
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id);

-- ============================================================
-- 5. Row Level Security for new tables
-- ============================================================
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_assignments ENABLE ROW LEVEL SECURITY;

-- batches: all authenticated users can read, only admin can modify
CREATE POLICY "Anyone can view batches" ON batches
    FOR SELECT USING (true);

CREATE POLICY "Only admin can manage batches" ON batches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- batch_assignments: all authenticated users can read, only admin can modify
CREATE POLICY "Anyone can view batch_assignments" ON batch_assignments
    FOR SELECT USING (true);

CREATE POLICY "Only admin can manage batch_assignments" ON batch_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
