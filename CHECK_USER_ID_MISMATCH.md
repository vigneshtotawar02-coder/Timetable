# Check: User ID Mismatch

## The Problem

Database shows faculty ID `353a644a-2ff6-41b5-a278-2a6ff6b4c3d0` has 3 timetable entries, but the logged-in faculty sees empty data.

## Most Likely Cause

**The logged-in faculty user has a DIFFERENT ID!**

## Quick Check

### In Browser Console (F12):

```javascript
// Check logged-in user
const user = JSON.parse(localStorage.getItem('tt_user'));
console.log("=== USER ID CHECK ===");
console.log("Logged in user ID:", user.id);
console.log("User name:", user.name);
console.log("User email:", user.email);
console.log("Expected faculty ID:", "353a644a-2ff6-41b5-a278-2a6ff6b4c3d0");
console.log("IDs MATCH:", user.id === "353a644a-2ff6-41b5-a278-2a6ff6b4c3d0");
```

## If IDs Don't Match

You have two options:

### Option 1: Login with Correct Faculty Account

1. Find the email for faculty ID `353a644a-2ff6-41b5-a278-2a6ff6b4c3d0`:

```sql
SELECT email, name FROM users 
WHERE id = '353a644a-2ff6-41b5-a278-2a6ff6b4c3d0';
```

2. Logout
3. Login with that email
4. Check timetable again

### Option 2: Assign Timetable to Current User

1. Get the current user's ID from console
2. Update the timetable entries:

```sql
-- First, check current user's ID from browser console
-- Then run this (replace CURRENT_USER_ID):

UPDATE timetable 
SET faculty_id = 'CURRENT_USER_ID'
WHERE faculty_id = '353a644a-2ff6-41b5-a278-2a6ff6b4c3d0';

-- Also update courses
UPDATE courses
SET faculty_id = 'CURRENT_USER_ID'
WHERE faculty_id = '353a644a-2ff6-41b5-a278-2a6ff6b4c3d0';
```

## Verify the Fix

After logging in with correct account or updating IDs:

1. Refresh the faculty timetable page
2. Check browser console
3. Should see:
```
Faculty User ID: 353a644a-2ff6-41b5-a278-2a6ff6b4c3d0
Number of entries: 3
```

4. Timetable grid should display classes

## Why This Happens

Common scenarios:
1. Multiple faculty accounts created during testing
2. Logged in with wrong account
3. Faculty was reassigned in database but not in auth
4. User data in localStorage is stale

## Prevention

Always verify user ID matches before debugging:
```javascript
// Add this check at the top of your debugging
const user = JSON.parse(localStorage.getItem('tt_user'));
console.log("Current user ID:", user.id);
```

Then use that ID in your SQL queries instead of assuming the ID.
