# Test Faculty Timetable API Directly

## The Issue
Database has 3 timetable entries for faculty ID `353a644a-2ff6-41b5-a278-2a6ff6b4c3d0`, but frontend receives empty array.

## Test the API Directly

### Step 1: Get Your Auth Token

1. Open browser console (F12) on any page while logged in as faculty
2. Run this:
```javascript
localStorage.getItem('tt_token')
```
3. Copy the token value

### Step 2: Test API with curl

Replace `YOUR_TOKEN` with the token from Step 1:

```bash
curl -X GET \
  "http://localhost:5000/api/timetable/faculty/353a644a-2ff6-41b5-a278-2a6ff6b4c3d0" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 3: Check Response

**Expected Response:**
```json
{
  "success": true,
  "count": 3,
  "data": {
    "timetable": [
      {
        "id": 1,
        "course_id": 5,
        "faculty_id": "353a644a-2ff6-41b5-a278-2a6ff6b4c3d0",
        "courses": { ... },
        "rooms": { ... },
        "time_slots": { ... }
      },
      ...
    ]
  }
}
```

**If you get empty array:**
```json
{
  "success": true,
  "count": 0,
  "data": {
    "timetable": []
  }
}
```

This means the backend query is not finding the data.

**If you get 401 Unauthorized:**
Token is invalid - re-login and get a fresh token.

**If you get 404:**
Route is not registered correctly.

### Step 4: Test in Browser Console

While on the faculty timetable page, run this in console:

```javascript
// Check what user ID is being used
console.log("User from localStorage:", JSON.parse(localStorage.getItem('tt_user')));

// Manually call the API
fetch('http://localhost:5000/api/timetable/faculty/353a644a-2ff6-41b5-a278-2a6ff6b4c3d0', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('tt_token'),
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log("Direct API call result:", data);
  console.log("Number of entries:", data.data.timetable.length);
})
.catch(err => console.error("API Error:", err));
```

### Step 5: Check if User ID Matches

Run this in browser console:

```javascript
const user = JSON.parse(localStorage.getItem('tt_user'));
console.log("Logged in user ID:", user.id);
console.log("Expected faculty ID:", "353a644a-2ff6-41b5-a278-2a6ff6b4c3d0");
console.log("IDs match:", user.id === "353a644a-2ff6-41b5-a278-2a6ff6b4c3d0");
```

**If IDs don't match:** The logged-in user is NOT the faculty with the timetable data!

## Possible Issues

### Issue 1: Wrong User Logged In
You're logged in as a different faculty member than the one with timetable data.

**Solution:** Login with the correct faculty account.

### Issue 2: User ID in localStorage is Different
The user object in localStorage has a different ID than the database.

**Solution:** Re-login to refresh the user data.

### Issue 3: API Route Issue
The route `/api/timetable/faculty/:id` is not working.

**Check backend logs:**
```bash
tail -f backend/logs/combined.log
```

Look for:
```
GET /api/timetable/faculty/353a644a-2ff6-41b5-a278-2a6ff6b4c3d0
=== FACULTY TIMETABLE REQUEST ===
Faculty ID: 353a644a-2ff6-41b5-a278-2a6ff6b4c3d0
```

### Issue 4: Supabase RLS (Row Level Security)
Supabase might be blocking the query due to RLS policies.

**Check in Supabase:**
1. Go to Table Editor
2. Select `timetable` table
3. Check RLS policies
4. Ensure faculty can read their own timetable entries

## Quick Fix Test

To quickly verify the system works, create a test endpoint:

Add this to `backend/src/routes/timetable.js`:

```javascript
// Test endpoint - remove after debugging
router.get('/test/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await require('../config/supabase').supabase
    .from('timetable')
    .select('*')
    .eq('faculty_id', id);
  
  res.json({ 
    faculty_id: id,
    count: data?.length || 0,
    data: data || [],
    error: error 
  });
});
```

Then test:
```bash
curl -X GET \
  "http://localhost:5000/api/timetable/test/353a644a-2ff6-41b5-a278-2a6ff6b4c3d0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This will show if the basic query works without the joins.
