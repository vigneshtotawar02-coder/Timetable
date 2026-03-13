-- Migration: Add semester column to users table
-- This allows students to have a semester associated with their profile

-- Add semester column to users table (nullable for admin and faculty)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS semester INTEGER CHECK (semester IS NULL OR (semester >= 1 AND semester <= 8));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_semester ON users(semester);

-- Add comment
COMMENT ON COLUMN users.semester IS 'Semester number for students (1-8), NULL for admin and faculty';

-- Update existing student users to have a default semester if needed
-- (This is optional - you may want to set this manually for existing users)
-- UPDATE users SET semester = 1 WHERE role = 'student' AND semester IS NULL;
