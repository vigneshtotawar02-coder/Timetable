# Debug: Empty Faculty Timetable (Courses Allocated & Timetable Generated)

## Situation
- ✅ Courses are allocated to faculty
- ✅ Timetable has been generated
- ❌ Faculty sees empty timetable (API returns [])

## Most Likely Causes

### 1. Faculty ID Mismatch
The faculty_id in the `courses` table doesn't match the faculty_id in the `timetable` table.

### 2. Wrong Department/Semester
Timetable was generated for a different department or semester than the faculty's courses.

### 3. Courses Assigned After Timetable Generation
Faculty was assigned courses after the timetable was already generated.

## Step-by-Step Debugging

### Step 1: Check Browser Console

1. Open faculty timetable page
2. Open browser console (F12)
3. Look for these logs:

```
=== FACULTY TIMETABLE DEBUG ===
Faculty User ID: [some-uuid]
Faculty Name: [name]
Faculty Email: [email]
API URL: /api/timetable/faculty/[uuid]
```

**Copy the Faculty User ID** - you'll need it for database queries.

### Step 2: Check Backend Logs

```bash
# In backend directory
tail -f logs/combined.log
```

Look for:
```
=== FACULTY TIMETABLE REQUEST ===
Faculty ID: [uuid]
Found X timetable entries for faculty [uuid]
```

If it says "Found 0 timetable entries", the issue is in the database.

### Step 3: Run Database Queries

Open Supabase SQL Editor and run these queries (replace `FACULTY_ID_HERE` with the actual UUID from Step 1):

**Query 1: Check courses assigned to faculty**
```sql
SELECT 
    c.id,
    c.course_name,
    c.department,
    c.semester,
    c.faculty_id
FROM courses c
WHERE c.faculty_id = 'FACULTY_ID_HERE';
```

Expected: Should return rows
If empty: Faculty has no courses assigned

**Query 2: Check timetable entries**
```sql
SELECT 
    t.*,
    c.course_name
FROM timetable t
JOIN courses c ON t.course_id = c.id
WHERE t.faculty_id = 'FACULTY_ID_HERE';
```

Expected: Should return rows
If empty: Problem found! See solutions below.

**Query 3: Check if faculty_id exists in timetable at all**
```sql
SELECT COUNT(*) FROM timetable WHERE faculty_id = 'FACULTY_ID_HERE';
```

Expected: Count > 0
If 0: Faculty not in timetable

### Step 4: Identify the Issue

Run the diagnostic query:
```sql
-- Check courses
SELECT 'Courses' as type, COUNT(*) as count 
FROM courses WHERE faculty_id = 'FACULTY_ID_HERE'
UNION ALL
-- Check timetable
SELECT 'Timetable' as type, COUNT(*) as count 
FROM timetable WHERE faculty_id = 'FACULTY_ID_HERE';
```

Results interpretation:
- Courses: 3, Timetable: 0 → **Timetable not generated for this faculty**
- Courses: 0, Timetable: 0 → **No courses assigned**
- Courses: 3, Timetable: 5 → **Should work** (check API/frontend issue)

## Solutions

### Solution 1: Regenerate Timetable

If courses exist but timetable doesn't:

1. Login as Admin
2. Go to Timetable page
3. Select the SAME department and semester as the faculty's courses
4. Click "Re-Generate"
5. Wait for completion
6. Refresh faculty page

### Solution 2: Check Department/Semester Match

```sql
-- Check what department/semester the courses are for
SELECT DISTINCT department, semester 
FROM courses 
WHERE faculty_id = 'FACULTY_ID_HERE';

-- Check what timetables have been generated
SELECT DISTINCT department, semester 
FROM timetable;
```

If they don't match, generate timetable for the correct department/semester.

### Solution 3: Fix Faculty ID Mismatch

If the faculty_id in courses doesn't match the user's actual ID:

```sql
-- Find the correct faculty user ID
SELECT id, name, email FROM users WHERE email = 'faculty@example.com';

-- Update courses to use correct faculty_id
UPDATE courses 
SET faculty_id = 'CORRECT_FACULTY_ID'
WHERE faculty_id = 'WRONG_FACULTY_ID';

-- Then regenerate timetable
```

### Solution 4: Manual Verification

Check if timetable generation included this faculty's courses:

```sql
-- Get course IDs for this faculty
SELECT id FROM courses WHERE faculty_id = 'FACULTY_ID_HERE';

-- Check if those courses are in timetable
SELECT t.*, c.course_name
FROM timetable t
JOIN courses c ON t.course_id = c.id
WHERE c.faculty_id = 'FACULTY_ID_HERE';
```

If courses exist but aren't in timetable, regenerate.

## Quick Test

To quickly test if the system works, try with a different faculty:

```sql
-- Find a faculty that HAS timetable entries
SELECT 
    u.name,
    u.email,
    u.id,
    COUNT(t.id) as classes
FROM users u
JOIN timetable t ON u.id = t.faculty_id
WHERE u.role = 'faculty'
GROUP BY u.id, u.name, u.email
HAVING COUNT(t.id) > 0
LIMIT 1;
```

Login with that faculty's credentials and check if their timetable shows.

## Common Mistakes

### Mistake 1: Generated for Wrong Semester
Faculty teaches Semester 3, but admin generated timetable for Semester 5.

**Fix**: Generate for Semester 3.

### Mistake 2: UUID String vs UUID Type
Sometimes the faculty_id is stored as string instead of UUID.

**Check**:
```sql
SELECT pg_typeof(faculty_id) FROM courses LIMIT 1;
SELECT pg_typeof(faculty_id) FROM timetable LIMIT 1;
```

Both should be `uuid`.

### Mistake 3: Courses Assigned After Generation
Admin assigned courses AFTER generating timetable.

**Fix**: Regenerate timetable.

## Still Not Working?

1. Check the complete SQL debug file: `backend/database/debug_faculty_timetable.sql`
2. Check backend logs: `backend/logs/combined.log`
3. Check browser Network tab for API errors
4. Verify authentication token is valid
5. Try with a fresh login

## Success Indicators

✅ Backend logs show: "Found X timetable entries" (X > 0)
✅ Browser console shows: "Number of entries: X" (X > 0)
✅ SQL query returns rows
✅ Timetable grid displays classes
