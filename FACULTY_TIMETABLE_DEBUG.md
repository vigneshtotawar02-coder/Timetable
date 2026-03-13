# Faculty Timetable Debug Guide

## Issue
Faculty timetable shows allocated courses in the "My Courses" section but the timetable grid is empty.

## Root Cause
The backend returns nested data with field names `courses`, `rooms`, and `time_slots` (plural), but the frontend was looking for `course`, `room`, and `time_slot_details` (singular/different names).

## Fix Applied
Updated the frontend to handle both field name formats:

```typescript
// Handle both nested and flat structures
const day = row.time_slots?.day || row.time_slot_details?.day || row.day;
const start = row.time_slots?.start_time || row.time_slot_details?.start_time;
const end = row.time_slots?.end_time || row.time_slot_details?.end_time;

const courseName = row.courses?.course_name || row.course?.course_name || String(row.course_id);
const roomName = row.rooms?.room_name || row.room?.room_name || "TBA";
```

## Backend Response Structure
```json
{
  "id": 1,
  "course_id": 5,
  "faculty_id": "uuid",
  "room_id": 2,
  "day": "Monday",
  "time_slot": 3,
  "semester": 3,
  "department": "Computer Science",
  "courses": {
    "id": 5,
    "course_name": "Data Structures",
    "department": "Computer Science",
    "weekly_hours": 4
  },
  "rooms": {
    "id": 2,
    "room_name": "Room 101",
    "capacity": 30
  },
  "time_slots": {
    "id": 3,
    "day": "Monday",
    "start_time": "09:00:00",
    "end_time": "10:00:00"
  },
  "course": { ... },
  "room": { ... },
  "time_slot_details": { ... }
}
```

## Testing Steps

1. **Login as Faculty**
2. **Open Browser Console** (F12)
3. **Navigate to Faculty Timetable**
4. **Check Console Logs**:
   - "Faculty timetable raw data:" - Should show array of timetable entries
   - "Sample entry:" - Should show first entry structure
   - "Processing row:" - Should show each row being processed
   - "Day: ..., Start: ..., End: ..." - Should show extracted values
   - "Created slot label:" - Should show formatted time slot
   - "Final grid:" - Should show populated grid object

5. **Verify Display**:
   - Statistics cards show correct numbers
   - Timetable grid shows classes in correct time slots
   - Course names, rooms, and times are visible

## If Still Not Working

Check console for:
- "Skipping row - missing day/time info" - Means data extraction failed
- Empty grid object - Means no rows were processed
- Null/undefined values - Means field names don't match

## Files Modified
- `src/pages/faculty/FacultyTimetable.tsx`
- `src/pages/faculty/FacultyDashboard.tsx`
