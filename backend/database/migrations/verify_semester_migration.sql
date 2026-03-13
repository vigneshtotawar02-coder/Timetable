-- Verification Script for Semester Migration
-- Run this after applying the add_semester_to_users.sql migration

-- 1. Check if semester column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'semester';

-- Expected: One row showing semester column with INTEGER type, nullable = YES

-- 2. Check the constraint
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%semester%';

-- Expected: Constraint showing semester IS NULL OR (semester >= 1 AND semester <= 8)

-- 3. Check if index was created
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users' 
  AND indexname = 'idx_users_semester';

-- Expected: One row showing the index on semester column

-- 4. View current users and their semesters
SELECT 
    id,
    name,
    email,
    role,
    department,
    semester,
    created_at
FROM users
ORDER BY role, semester;

-- 5. Count users by role and semester
SELECT 
    role,
    semester,
    COUNT(*) as user_count
FROM users
GROUP BY role, semester
ORDER BY role, semester;

-- 6. Find students without semester (need to be updated)
SELECT 
    id,
    name,
    email,
    department
FROM users
WHERE role = 'student' 
  AND semester IS NULL;

-- If any students are found, update them with appropriate semester values
-- Example:
-- UPDATE users SET semester = 1 WHERE id = 'student-uuid-here';
