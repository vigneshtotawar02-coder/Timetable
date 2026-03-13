# Faculty Timetable Troubleshooting Guide

## Issue: Empty Timetable (No Data)

### Console Output
```
Faculty timetable raw data: []
Sample entry: undefined
Final grid: {}
Stats: {courses: 0, rooms: 0, timeSlots: 0}
```

This means the API is returning an empty array - no timetable entries exist for this faculty member.

## Root Causes & Solutions

### 1. No Timetable Generated Yet

**Problem**: Admin hasn't generated a timetable for the department/semester where this faculty teaches.

**Solution**:
1. Login as Admin
2. Go to "Timetable" page
3. Select the department and semester
4. Click "Generate" button
5. Wait for generation to complete
6. Faculty member should now see their schedule

### 2. Faculty Has No Courses Assigned

**Problem**: The faculty member exists but has no courses assigned to them.

**Check**:
1. Login as Admin
2. Go to "Courses" page
3. Look for courses assigned to this faculty member
4. Check if `faculty_id` matches the logged-in faculty's user ID

**Solution**:
1. Assign courses to the faculty member
2. Generate/regenerate the timetable
3. Faculty should now see their schedule

### 3. Courses Assigned But Not in Timetable

**Problem**: Faculty has courses assigned, but those courses weren't included in timetable generation.

**Check**:
```sql
-- Check if faculty has courses
SELECT * FROM courses WHERE faculty_id = 'faculty-user-id';

-- Check if those courses are in timetable
SELECT t.*, c.course_name 
FROM timetable t
JOIN courses c ON t.course_id = c.id
WHERE t.faculty_id = 'faculty-user-id';
```

**Solution**:
1. Ensure courses have correct department and semester
2. Regenerate timetable for that department/semester
3. Check if generation succeeded

### 4. Database Query Issue

**Problem**: The backend query might be failing silently.

**Check Backend Logs**:
```bash
# Check backend logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

**Test API Directly**:
```bash
# Get faculty ID from login
# Then test the endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/timetable/faculty/FACULTY_ID
```

## Step-by-Step Diagnosis

### Step 1: Verify Faculty User ID
```javascript
// In browser console on faculty page
console.log("Faculty User ID:", user?.id);
console.log("Faculty Name:", user?.name);
console.log("Faculty Department:", user?.department);
```

### Step 2: Check Courses Assignment
As Admin, run this query in Supabase SQL Editor:
```sql
SELECT 
  c.id,
  c.course_name,
  c.department,
  c.semester,
  c.faculty_id,
  u.name as faculty_name
FROM courses c
LEFT JOIN users u ON c.faculty_id = u.id
WHERE c.faculty_id = 'PASTE_FACULTY_ID_HERE';
```

### Step 3: Check Timetable Entries
```sql
SELECT 
  t.*,
  c.course_name,
  r.room_name,
  ts.day,
  ts.start_time,
  ts.end_time
FROM timetable t
JOIN courses c ON t.course_id = c.id
JOIN rooms r ON t.room_id = r.id
JOIN time_slots ts ON t.time_slot = ts.id
WHERE t.faculty_id = 'PASTE_FACULTY_ID_HERE'
ORDER BY ts.day, ts.start_time;
```

### Step 4: Check Timetable Generation
```sql
-- Check if any timetable exists for the department
SELECT 
  department,
  semester,
  COUNT(*) as total_classes
FROM timetable
GROUP BY department, semester
ORDER BY department, semester;
```

## Quick Fix Workflow

### For Testing/Development:

1. **Assign a Course to Faculty**:
```sql
-- Find a course
SELECT * FROM courses LIMIT 5;

-- Assign it to your faculty
UPDATE courses 
SET faculty_id = 'YOUR_FACULTY_ID'
WHERE id = 1;  -- Replace with actual course ID
```

2. **Generate Timetable**:
   - Login as Admin
   - Go to Timetable page
   - Select department and semester matching the course
   - Click "Generate"

3. **Verify**:
   - Login as Faculty
   - Refresh the page
   - Check console logs
   - Timetable should now appear

## Common Mistakes

### Mistake 1: Wrong Department/Semester
Faculty teaches "Computer Science" Semester 3, but timetable was generated for "Computer Science" Semester 5.

**Fix**: Generate timetable for the correct semester.

### Mistake 2: Course Without Faculty
Course exists but `faculty_id` is NULL.

**Fix**: Assign faculty to the course before generating timetable.

### Mistake 3: Timetable Not Regenerated
Courses were assigned after timetable generation.

**Fix**: Regenerate the timetable.

## Expected Data Flow

1. **Admin creates course** → `courses` table
2. **Admin assigns faculty to course** → `courses.faculty_id` = faculty user ID
3. **Admin generates timetable** → `timetable` table populated
4. **Faculty views timetable** → API filters by `faculty_id`
5. **Frontend displays** → Shows only faculty's classes

## API Endpoint Details

**Endpoint**: `GET /api/timetable/faculty/:id`

**Parameters**:
- `:id` - Faculty user ID (UUID)
- `semester` (optional query param) - Filter by semester

**Response**:
```json
{
  "success": true,
  "count": 5,
  "data": {
    "timetable": [
      {
        "id": 1,
        "course_id": 3,
        "faculty_id": "uuid",
        "room_id": 2,
        "day": "Monday",
        "time_slot": 5,
        "semester": 3,
        "department": "Computer Science",
        "courses": { "course_name": "Data Structures", ... },
        "rooms": { "room_name": "Room 101", ... },
        "time_slots": { "day": "Monday", "start_time": "09:00", ... }
      }
    ]
  }
}
```

## Still Not Working?

1. Check backend is running: `http://localhost:5000/api/health`
2. Check authentication token is valid
3. Check database connection
4. Review backend error logs
5. Test with a different faculty account
6. Try regenerating all timetables
7. Check browser network tab for API errors
