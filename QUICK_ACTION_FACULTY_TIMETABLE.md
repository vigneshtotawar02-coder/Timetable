# Quick Action: Fix Empty Faculty Timetable

## Problem
Faculty timetable shows empty grid with message "No Classes Allocated"

## Quick Solution (3 Steps)

### Step 1: Assign Course to Faculty (As Admin)

**Option A: Via UI**
1. Login as Admin
2. Go to "Courses" page
3. Find or create a course
4. Edit the course
5. Select the faculty member from dropdown
6. Save

**Option B: Via Database**
```sql
-- Find your faculty ID
SELECT id, name, email FROM users WHERE role = 'faculty';

-- Assign a course to them
UPDATE courses 
SET faculty_id = 'PASTE_FACULTY_ID_HERE'
WHERE id = 1;  -- Or any course ID
```

### Step 2: Generate Timetable (As Admin)

1. Login as Admin
2. Go to "Timetable" page
3. Select Department (e.g., "Computer Science")
4. Select Semester (e.g., "3")
5. Click "Generate" or "Re-Generate" button
6. Wait for success message

### Step 3: Verify (As Faculty)

1. Login as Faculty
2. Go to "My Timetable"
3. Refresh page (F5)
4. Check browser console (F12)
5. Should see data in console logs
6. Timetable grid should display classes

## Verification Checklist

- [ ] Faculty has at least one course assigned
- [ ] Course department matches faculty department
- [ ] Timetable generated for that department/semester
- [ ] Faculty can see their courses in "My Courses" section
- [ ] Timetable grid shows classes in time slots
- [ ] Statistics show correct numbers

## If Still Empty

Check these in order:

1. **Course Assignment**:
   ```sql
   SELECT c.*, u.name as faculty_name
   FROM courses c
   LEFT JOIN users u ON c.faculty_id = u.id
   WHERE c.faculty_id = 'FACULTY_ID';
   ```
   Should return at least one row.

2. **Timetable Entries**:
   ```sql
   SELECT COUNT(*) FROM timetable WHERE faculty_id = 'FACULTY_ID';
   ```
   Should return > 0.

3. **API Response**:
   - Open browser Network tab (F12)
   - Refresh faculty timetable page
   - Find request to `/api/timetable/faculty/...`
   - Check response - should have data array with entries

## Common Issues

**Issue**: "No courses assigned yet" in My Courses section
**Fix**: Assign courses to faculty (Step 1)

**Issue**: Courses show but timetable empty
**Fix**: Generate timetable (Step 2)

**Issue**: API returns empty array
**Fix**: Ensure course department/semester matches generated timetable

**Issue**: 401 Unauthorized error
**Fix**: Re-login to get fresh authentication token

## Test Data Setup (Development)

```sql
-- 1. Create/verify faculty user
INSERT INTO users (id, email, name, role, department)
VALUES (
  'test-faculty-id',
  'faculty@test.com',
  'Dr. Test Faculty',
  'faculty',
  'Computer Science'
) ON CONFLICT (email) DO NOTHING;

-- 2. Create a test course
INSERT INTO courses (course_name, department, semester, faculty_id, weekly_hours)
VALUES (
  'Test Course',
  'Computer Science',
  3,
  'test-faculty-id',
  4
);

-- 3. Generate timetable via Admin UI for Computer Science, Semester 3

-- 4. Verify
SELECT * FROM timetable WHERE faculty_id = 'test-faculty-id';
```

## Success Indicators

✅ Console shows: `Faculty timetable raw data: [...]` (array with data)
✅ Console shows: `Number of entries: 5` (or any number > 0)
✅ Statistics cards show non-zero values
✅ Timetable grid displays classes
✅ Course names, rooms, and times are visible
