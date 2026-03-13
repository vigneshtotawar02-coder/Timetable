# Fix: Student Semester Field Not Being Fetched

## Problem
The student's semester was not being stored or fetched from the database, causing the timetable to not load correctly for students.

## Root Cause
The `users` table in the database schema did not have a `semester` column. The semester information was only stored in the `courses` table, but students needed their own semester field to view their department's timetable.

## Solution Implemented

### 1. Database Migration
**File:** `backend/database/migrations/add_semester_to_users.sql`

Added a `semester` column to the `users` table:
- Type: INTEGER
- Nullable: Yes (NULL for admin and faculty)
- Constraint: Values must be between 1-8 or NULL
- Indexed for better query performance

### 2. Backend Updates

#### Auth Controller (`backend/src/controllers/authController.js`)
- **Register endpoint**: Now accepts and stores `semester` field for student users
- **Update user endpoint**: Now accepts `semester` field for profile updates
- Semester is automatically included in login response

### 3. Frontend Updates

#### API Client (`src/lib/api.ts`)
- Updated `registerApi` function to accept optional `semester` parameter
- Type definition updated to include `semester?: number`

#### Register Page (`src/pages/auth/Register.tsx`)
- Already had semester field in the form (good!)
- Updated to actually send the semester value to the backend API
- Semester field only shows for student role
- Converts semester string to integer before sending

#### Auth Context (`src/contexts/AuthContext.tsx`)
- Already properly handles semester field (no changes needed)
- Stores semester in localStorage with user data
- Maps semester from API response to user object

### 4. Student Timetable Pages
Both pages already correctly use the semester from the user context:
- `src/pages/student/StudentDashboard.tsx`
- `src/pages/student/StudentTimetable.tsx`

## How to Apply the Fix

### Step 1: Run Database Migration
You need to apply the database migration to add the `semester` column:

**Using Supabase Dashboard:**
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy content from `backend/database/migrations/add_semester_to_users.sql`
4. Paste and run in SQL Editor

**Using Supabase CLI:**
```bash
cd backend
supabase db push migrations/add_semester_to_users.sql
```

See `backend/database/MIGRATION_INSTRUCTIONS.md` for detailed instructions.

### Step 2: Update Existing Student Records (If Any)
If you have existing student users, update them with semester values:

```sql
-- Example: Set semester for existing students
UPDATE users 
SET semester = 3 
WHERE email = 'student@example.com';
```

### Step 3: Restart Backend Server
```bash
cd backend
npm start
```

### Step 4: Test the Fix

1. **Register a new student:**
   - Go to `/register`
   - Select "Student" role
   - Fill in all fields including semester
   - Register successfully

2. **Login as student:**
   - Login with student credentials
   - Check browser console/localStorage to verify semester is stored

3. **View timetable:**
   - Navigate to "My Timetable"
   - Verify the correct semester is being used in the API call
   - Check browser Network tab: `/api/timetable/[department]/[semester]`

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] `semester` column exists in `users` table
- [ ] New student registration includes semester
- [ ] Student login returns semester in user data
- [ ] Student dashboard shows correct semester
- [ ] Student timetable page fetches data for correct semester
- [ ] Existing students updated with semester values

## API Changes

### Register Endpoint
**POST** `/api/auth/register`

Request body now includes:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "department": "Computer Science",
  "semester": 3
}
```

### Login Response
**POST** `/api/auth/login`

Response now includes semester:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "department": "Computer Science",
      "semester": 3
    },
    "session": { ... }
  }
}
```

## Files Modified

### Backend
- `backend/src/controllers/authController.js` - Added semester handling
- `backend/database/migrations/add_semester_to_users.sql` - New migration file
- `backend/database/MIGRATION_INSTRUCTIONS.md` - Migration guide

### Frontend
- `src/lib/api.ts` - Updated registerApi type
- `src/pages/auth/Register.tsx` - Send semester to API

### Documentation
- `SEMESTER_FIELD_FIX.md` - This file
- `STUDENT_TIMETABLE_GUIDE.md` - User guide (already created)

## Testing Scenarios

### Scenario 1: New Student Registration
1. Register as student with semester 3
2. Login
3. Navigate to timetable
4. Verify API call uses semester 3

### Scenario 2: Existing Student
1. Run SQL to update existing student's semester
2. Login as that student
3. Verify semester is loaded correctly

### Scenario 3: Faculty/Admin
1. Register/login as faculty or admin
2. Verify semester is NULL (not required)
3. Verify no errors occur

## Troubleshooting

### Issue: Semester still not showing
**Solution:** 
- Clear browser localStorage
- Re-login to fetch fresh user data
- Check browser console for errors

### Issue: Migration fails
**Solution:**
- Check if column already exists: `SELECT * FROM information_schema.columns WHERE table_name='users' AND column_name='semester';`
- If exists, migration already applied
- If not, check database permissions

### Issue: API returns 500 error
**Solution:**
- Check backend logs
- Verify migration was applied
- Restart backend server

## Future Enhancements

1. Add semester validation in frontend forms
2. Allow students to update their semester
3. Add semester progression tracking
4. Implement semester-based course recommendations
