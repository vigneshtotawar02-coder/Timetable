# Quick Fix Guide: Student Semester Not Fetching

## Problem
Students' semester information was not being stored or retrieved from the database.

## Quick Fix (3 Steps)

### Step 1: Apply Database Migration (Required)
Run this SQL in your Supabase SQL Editor:

```sql
-- Add semester column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS semester INTEGER CHECK (semester IS NULL OR (semester >= 1 AND semester <= 8));

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_semester ON users(semester);
```

### Step 2: Update Existing Students (If Any)
If you have existing student accounts, update them:

```sql
-- View students without semester
SELECT id, name, email, department FROM users WHERE role = 'student' AND semester IS NULL;

-- Update specific student (replace with actual email and semester)
UPDATE users SET semester = 3 WHERE email = 'student@example.com';
```

### Step 3: Restart Backend
```bash
cd backend
npm start
```

## Test the Fix

1. **Register new student:**
   - Go to `/register`
   - Select "Student" role
   - Choose a semester (1-8)
   - Complete registration

2. **Login and verify:**
   - Login as student
   - Go to "My Timetable"
   - Check browser Network tab
   - Verify API call: `/api/timetable/[department]/[semester]`

## What Was Changed

### Backend
- ✅ Database: Added `semester` column to `users` table
- ✅ Auth Controller: Now saves and returns semester for students

### Frontend
- ✅ Register Form: Now sends semester to backend
- ✅ Auth Context: Already handles semester correctly
- ✅ Timetable Pages: Already use semester from user context

## Files to Review

### Migration Files
- `backend/database/migrations/add_semester_to_users.sql` - Main migration
- `backend/database/migrations/verify_semester_migration.sql` - Verification queries
- `backend/database/migrations/update_existing_students.sql` - Update existing data

### Code Changes
- `backend/src/controllers/authController.js` - Register & update endpoints
- `src/lib/api.ts` - API type definitions
- `src/pages/auth/Register.tsx` - Form submission

### Documentation
- `SEMESTER_FIELD_FIX.md` - Complete technical details
- `backend/database/MIGRATION_INSTRUCTIONS.md` - Detailed migration guide
- `STUDENT_TIMETABLE_GUIDE.md` - User guide

## Troubleshooting

**Semester still not showing?**
- Clear browser localStorage and re-login
- Check backend logs for errors
- Verify migration was applied: `SELECT * FROM information_schema.columns WHERE table_name='users' AND column_name='semester';`

**Migration fails?**
- Check if column already exists
- Verify database permissions
- Try running migration line by line

**API errors?**
- Restart backend server
- Check backend logs: `backend/logs/error.log`
- Verify user data in database

## Need More Help?

See detailed documentation:
- `SEMESTER_FIELD_FIX.md` - Full technical documentation
- `backend/database/MIGRATION_INSTRUCTIONS.md` - Step-by-step migration guide
