-- Debug Faculty Timetable Issue
-- Run these queries in Supabase SQL Editor to diagnose the problem

-- ============================================
-- STEP 1: Find the faculty user
-- ============================================
-- Replace 'faculty@example.com' with the actual faculty email
SELECT 
    id as faculty_id,
    name,
    email,
    role,
    department
FROM users 
WHERE role = 'faculty'
ORDER BY name;

-- Copy the faculty_id from above and use it in queries below
-- Replace 'FACULTY_ID_HERE' with the actual UUID

-- ============================================
-- STEP 2: Check if faculty has courses assigned
-- ============================================
SELECT 
    c.id as course_id,
    c.course_name,
    c.department,
    c.semester,
    c.faculty_id,
    c.weekly_hours,
    u.name as faculty_name
FROM courses c
LEFT JOIN users u ON c.faculty_id = u.id
WHERE c.faculty_id = 'FACULTY_ID_HERE';

-- Expected: Should return at least one row
-- If empty: Faculty has no courses assigned

-- ============================================
-- STEP 3: Check if timetable exists for those courses
-- ============================================
SELECT 
    t.id,
    t.course_id,
    t.faculty_id,
    t.room_id,
    t.day,
    t.time_slot,
    t.semester,
    t.department,
    c.course_name,
    r.room_name,
    ts.day as slot_day,
    ts.start_time,
    ts.end_time
FROM timetable t
JOIN courses c ON t.course_id = c.id
JOIN rooms r ON t.room_id = r.id
JOIN time_slots ts ON t.time_slot = ts.id
WHERE t.faculty_id = 'FACULTY_ID_HERE'
ORDER BY ts.day, ts.start_time;

-- Expected: Should return multiple rows (one per class)
-- If empty: Timetable not generated or faculty_id mismatch

-- ============================================
-- STEP 4: Check timetable entries (raw)
-- ============================================
SELECT * FROM timetable 
WHERE faculty_id = 'FACULTY_ID_HERE';

-- Expected: Should return rows
-- If empty: No timetable entries for this faculty

-- ============================================
-- STEP 5: Check if faculty_id matches in both tables
-- ============================================
SELECT 
    'courses' as table_name,
    faculty_id,
    COUNT(*) as count
FROM courses
WHERE faculty_id = 'FACULTY_ID_HERE'
GROUP BY faculty_id

UNION ALL

SELECT 
    'timetable' as table_name,
    faculty_id,
    COUNT(*) as count
FROM timetable
WHERE faculty_id = 'FACULTY_ID_HERE'
GROUP BY faculty_id;

-- Expected: Both should show the same faculty_id with counts > 0
-- If only courses shows: Timetable not generated
-- If faculty_id different: Data mismatch issue

-- ============================================
-- STEP 6: Check all timetables by department
-- ============================================
SELECT 
    department,
    semester,
    COUNT(*) as total_classes,
    COUNT(DISTINCT faculty_id) as faculty_count,
    COUNT(DISTINCT course_id) as course_count
FROM timetable
GROUP BY department, semester
ORDER BY department, semester;

-- This shows which departments/semesters have timetables generated

-- ============================================
-- STEP 7: Find faculty by checking timetable
-- ============================================
-- If you're not sure which faculty has data, run this:
SELECT 
    u.id,
    u.name,
    u.email,
    u.department,
    COUNT(t.id) as class_count
FROM users u
LEFT JOIN timetable t ON u.id = t.faculty_id
WHERE u.role = 'faculty'
GROUP BY u.id, u.name, u.email, u.department
ORDER BY class_count DESC;

-- This shows all faculty and how many classes they have in timetable

-- ============================================
-- STEP 8: Check for UUID format issues
-- ============================================
-- Sometimes the issue is UUID format mismatch
SELECT 
    'users' as source,
    id,
    name,
    pg_typeof(id) as id_type
FROM users 
WHERE role = 'faculty'
LIMIT 1;

-- Should show UUID type

-- ============================================
-- DIAGNOSTIC SUMMARY
-- ============================================
-- Run this to get a complete picture:
WITH faculty_courses AS (
    SELECT 
        u.id as faculty_id,
        u.name as faculty_name,
        u.email,
        u.department as faculty_dept,
        COUNT(c.id) as courses_assigned
    FROM users u
    LEFT JOIN courses c ON u.id = c.faculty_id
    WHERE u.role = 'faculty'
    GROUP BY u.id, u.name, u.email, u.department
),
faculty_timetable AS (
    SELECT 
        faculty_id,
        COUNT(*) as classes_in_timetable
    FROM timetable
    GROUP BY faculty_id
)
SELECT 
    fc.faculty_id,
    fc.faculty_name,
    fc.email,
    fc.faculty_dept,
    fc.courses_assigned,
    COALESCE(ft.classes_in_timetable, 0) as classes_in_timetable,
    CASE 
        WHEN fc.courses_assigned = 0 THEN 'No courses assigned'
        WHEN COALESCE(ft.classes_in_timetable, 0) = 0 THEN 'Courses assigned but no timetable'
        ELSE 'OK'
    END as status
FROM faculty_courses fc
LEFT JOIN faculty_timetable ft ON fc.faculty_id = ft.faculty_id
ORDER BY fc.faculty_name;

-- This shows the complete status of all faculty members
