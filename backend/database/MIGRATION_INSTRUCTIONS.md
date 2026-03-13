# Database Migration Instructions

## Adding Semester Field to Users Table

### Overview
This migration adds a `semester` column to the `users` table to store the semester information for student users.

### Migration File
`migrations/add_semester_to_users.sql`

### How to Apply the Migration

#### Option 1: Using Supabase Dashboard (Recommended)
1. Log in to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `backend/database/migrations/add_semester_to_users.sql`
4. Copy the SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

#### Option 2: Using Supabase CLI
```bash
# Navigate to backend directory
cd backend

# Run the migration
supabase db push migrations/add_semester_to_users.sql
```

#### Option 3: Using psql (Direct Database Connection)
```bash
# Connect to your database
psql "postgresql://[user]:[password]@[host]:[port]/[database]"

# Run the migration file
\i backend/database/migrations/add_semester_to_users.sql
```

### Verification

After running the migration, verify it was successful:

```sql
-- Check if the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'semester';

-- Check the constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%semester%';
```

Expected output:
- Column `semester` should exist with type `integer`
- It should be nullable (NULL allowed)
- Check constraint should enforce values between 1 and 8 (or NULL)

### Update Existing Student Records (Optional)

If you have existing student users without a semester value, you can update them:

```sql
-- Set a default semester for existing students
UPDATE users 
SET semester = 1 
WHERE role = 'student' AND semester IS NULL;

-- Or update specific students
UPDATE users 
SET semester = 3 
WHERE email = 'student@example.com';
```

### Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove the semester column
ALTER TABLE users DROP COLUMN IF EXISTS semester;

-- Remove the index
DROP INDEX IF EXISTS idx_users_semester;
```

### Testing

After migration, test the following:

1. **Register a new student** with a semester value
2. **Login as a student** and verify semester is returned
3. **View student timetable** and verify it uses the correct semester
4. **Update student profile** to change semester

### Backend Changes Required

The following backend files have been updated to support the semester field:
- `backend/src/controllers/authController.js` - Register and update user endpoints
- Frontend API client - `src/lib/api.ts`
- Frontend registration form - `src/pages/auth/Register.tsx`

### Notes

- The `semester` field is optional (nullable) for admin and faculty users
- For student users, it's recommended to always set a semester value
- Valid semester values are 1-8 (representing 8 semesters in a 4-year program)
- The field is indexed for better query performance
