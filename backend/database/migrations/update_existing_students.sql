-- Script to Update Existing Student Records with Semester Values
-- Run this AFTER applying the add_semester_to_users.sql migration

-- IMPORTANT: Review and modify the UPDATE statements based on your actual data
-- before running this script!

-- Option 1: Set a default semester for all students without one
-- Uncomment the line below to set all students to semester 1
-- UPDATE users SET semester = 1 WHERE role = 'student' AND semester IS NULL;

-- Option 2: Update students by department (example)
-- Uncomment and modify as needed:
-- UPDATE users SET semester = 3 WHERE role = 'student' AND department = 'Computer Science' AND semester IS NULL;
-- UPDATE users SET semester = 5 WHERE role = 'student' AND department = 'Electrical Engineering' AND semester IS NULL;

-- Option 3: Update specific students by email
-- Uncomment and modify as needed:
-- UPDATE users SET semester = 3 WHERE email = 'student1@example.com';
-- UPDATE users SET semester = 5 WHERE email = 'student2@example.com';

-- Option 4: Interactive update (for manual execution)
-- First, view all students without semester:
SELECT 
    id,
    name,
    email,
    department,
    semester
FROM users
WHERE role = 'student'
ORDER BY department, name;

-- Then update individually:
-- UPDATE users SET semester = [semester_number] WHERE id = '[student-uuid]';

-- Verification: Check all students now have semester values
SELECT 
    department,
    semester,
    COUNT(*) as student_count
FROM users
WHERE role = 'student'
GROUP BY department, semester
ORDER BY department, semester;

-- Final check: Ensure no students are missing semester
SELECT COUNT(*) as students_without_semester
FROM users
WHERE role = 'student' AND semester IS NULL;

-- Expected: 0 students without semester
