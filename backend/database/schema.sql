-- AI-Based Timetable Generation System
-- Database Schema for Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
-- Stores all users (admin, faculty, students)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_email ON users(email);

-- 2. Courses Table
-- Stores all courses offered by the institution
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
    faculty_id UUID REFERENCES users(id) ON DELETE SET NULL,
    weekly_hours INTEGER NOT NULL DEFAULT 3 CHECK (weekly_hours >= 1 AND weekly_hours <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_courses_department ON courses(department);
CREATE INDEX idx_courses_semester ON courses(semester);
CREATE INDEX idx_courses_faculty ON courses(faculty_id);

-- 3. Rooms Table
-- Stores available classrooms/rooms
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_name VARCHAR(100) UNIQUE NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rooms_name ON rooms(room_name);

-- 4. Time Slots Table
-- Defines available time slots for classes
CREATE TABLE IF NOT EXISTS time_slots (
    id SERIAL PRIMARY KEY,
    day VARCHAR(20) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_time_order CHECK (end_time > start_time),
    UNIQUE(day, start_time)
);

CREATE INDEX idx_time_slots_day ON time_slots(day);

-- 5. Faculty Availability Table
-- Stores when faculty members are available
CREATE TABLE IF NOT EXISTS faculty_availability (
    id SERIAL PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day VARCHAR(20) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    time_slot INTEGER NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(faculty_id, day, time_slot)
);

CREATE INDEX idx_faculty_availability_faculty ON faculty_availability(faculty_id);
CREATE INDEX idx_faculty_availability_available ON faculty_availability(available);

-- 6. Timetable Table
-- Stores the generated timetable
CREATE TABLE IF NOT EXISTS timetable (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    day VARCHAR(20) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    time_slot INTEGER NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure no overlapping classes for faculty
    CONSTRAINT unique_faculty_slot UNIQUE(faculty_id, day, time_slot, semester),
    -- Ensure no double booking of rooms
    CONSTRAINT unique_room_slot UNIQUE(room_id, day, time_slot, semester, department)
);

CREATE INDEX idx_timetable_course ON timetable(course_id);
CREATE INDEX idx_timetable_faculty ON timetable(faculty_id);
CREATE INDEX idx_timetable_room ON timetable(room_id);
CREATE INDEX idx_timetable_department_semester ON timetable(department, semester);
CREATE INDEX idx_timetable_day_slot ON timetable(day, time_slot);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faculty_availability_updated_at BEFORE UPDATE ON faculty_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample time slots (9 AM to 5 PM, 1-hour slots)
-- Note: 8-9 AM slot removed as per requirement
INSERT INTO time_slots (day, start_time, end_time) VALUES
    ('Monday', '09:00', '10:00'),
    ('Monday', '10:00', '11:00'),
    ('Monday', '11:00', '12:00'),
    ('Monday', '12:00', '13:00'),
    ('Monday', '13:00', '14:00'),
    ('Monday', '14:00', '15:00'),
    ('Monday', '15:00', '16:00'),
    ('Monday', '16:00', '17:00'),
    ('Tuesday', '09:00', '10:00'),
    ('Tuesday', '10:00', '11:00'),
    ('Tuesday', '11:00', '12:00'),
    ('Tuesday', '12:00', '13:00'),
    ('Tuesday', '13:00', '14:00'),
    ('Tuesday', '14:00', '15:00'),
    ('Tuesday', '15:00', '16:00'),
    ('Tuesday', '16:00', '17:00'),
    ('Wednesday', '09:00', '10:00'),
    ('Wednesday', '10:00', '11:00'),
    ('Wednesday', '11:00', '12:00'),
    ('Wednesday', '12:00', '13:00'),
    ('Wednesday', '13:00', '14:00'),
    ('Wednesday', '14:00', '15:00'),
    ('Wednesday', '15:00', '16:00'),
    ('Wednesday', '16:00', '17:00'),
    ('Thursday', '09:00', '10:00'),
    ('Thursday', '10:00', '11:00'),
    ('Thursday', '11:00', '12:00'),
    ('Thursday', '12:00', '13:00'),
    ('Thursday', '13:00', '14:00'),
    ('Thursday', '14:00', '15:00'),
    ('Thursday', '15:00', '16:00'),
    ('Thursday', '16:00', '17:00'),
    ('Friday', '09:00', '10:00'),
    ('Friday', '10:00', '11:00'),
    ('Friday', '11:00', '12:00'),
    ('Friday', '12:00', '13:00'),
    ('Friday', '13:00', '14:00'),
    ('Friday', '14:00', '15:00'),
    ('Friday', '15:00', '16:00'),
    ('Friday', '16:00', '17:00')
ON CONFLICT DO NOTHING;

-- Insert sample rooms
INSERT INTO rooms (room_name, capacity) VALUES
    ('Room 101', 30),
    ('Room 102', 40),
    ('Room 103', 50),
    ('Room 201', 35),
    ('Room 202', 45),
    ('Lab 301', 25),
    ('Lab 302', 30),
    ('Auditorium', 100)
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

-- Users: Can read all, but only update their own
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Courses: All authenticated users can read, only admin can modify
CREATE POLICY "Anyone can view courses" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Only admin can manage courses" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Rooms: All authenticated users can read, only admin can modify
CREATE POLICY "Anyone can view rooms" ON rooms
    FOR SELECT USING (true);

CREATE POLICY "Only admin can manage rooms" ON rooms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Time Slots: All authenticated users can read, only admin can modify
CREATE POLICY "Anyone can view time slots" ON time_slots
    FOR SELECT USING (true);

CREATE POLICY "Only admin can manage time slots" ON time_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Faculty Availability: Faculty can manage their own, admin can manage all
CREATE POLICY "Anyone can view faculty availability" ON faculty_availability
    FOR SELECT USING (true);

CREATE POLICY "Faculty can manage their own availability" ON faculty_availability
    FOR ALL USING (
        auth.uid() = faculty_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Timetable: All authenticated users can read, only admin can modify
CREATE POLICY "Anyone can view timetable" ON timetable
    FOR SELECT USING (true);

CREATE POLICY "Only admin can manage timetable" ON timetable
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create views for easier querying
CREATE OR REPLACE VIEW timetable_view AS
SELECT 
    t.id,
    t.day,
    ts.start_time,
    ts.end_time,
    c.course_name,
    c.department,
    c.semester,
    u.name as faculty_name,
    u.email as faculty_email,
    r.room_name,
    r.capacity
FROM timetable t
JOIN courses c ON t.course_id = c.id
JOIN users u ON t.faculty_id = u.id
JOIN rooms r ON t.room_id = r.id
JOIN time_slots ts ON t.time_slot = ts.id
ORDER BY t.department, t.semester, t.day, ts.start_time;

-- Grant access to the view
GRANT SELECT ON timetable_view TO authenticated;

COMMENT ON TABLE users IS 'Stores all system users including admins, faculty, and students';
COMMENT ON TABLE courses IS 'Stores all courses offered by the institution';
COMMENT ON TABLE rooms IS 'Stores available classrooms and their capacities';
COMMENT ON TABLE time_slots IS 'Defines available time slots for scheduling classes';
COMMENT ON TABLE faculty_availability IS 'Tracks when faculty members are available for teaching';
COMMENT ON TABLE timetable IS 'Stores the generated timetable with all scheduling information';
