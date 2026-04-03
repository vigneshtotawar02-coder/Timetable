# Implementation Plan: Batch Practical Scheduling

## Overview

Implement batch-based practical lab scheduling across the database, backend service, REST API, and frontend views. Each task builds incrementally on the previous one, ending with full integration.

## Tasks

- [x] 1. Database schema migration
  - Create `batches` table with columns `id`, `name`, `department`, `semester`, `created_at` and unique constraint on `(name, department, semester)`
  - Create `batch_assignments` table with columns `id`, `batch_id`, `course_id`, `room_id`, `day`, `time_slot`, `week_number`, `department`, `semester`, `created_at`, cascade delete on `batch_id`, and unique constraint on `(batch_id, course_id, week_number)`
  - Add `rotation_group TEXT` and `course_type TEXT DEFAULT 'lecture'` columns to `courses` table via `ALTER TABLE`
  - Run migration against Supabase (SQL editor or migration file)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2. TypeScript type extensions
  - [x] 2.1 Add `Batch`, `BatchAssignment`, and `BatchAssignmentCell` interfaces to `src/types/index.ts`
    - Extend `TimetableCell` with optional `batchName?: string` and `batchAssignments?: BatchAssignmentCell[]`
    - _Requirements: 1.1, 5.2, 6.2_

- [ ] 3. Backend: BatchPracticalScheduler service
  - [-] 3.1 Create `backend/src/services/batchPracticalScheduler.js`
    - Implement `groupByRotationGroup(courses)` — groups practical courses by `rotation_group`
    - Implement `validateGroupSize(group, batches)` — returns error if `|courses| !== |batches|`
    - Implement `buildRotationMatrix(batches, courses)` — returns N×N Latin-square rotation as array of week objects `[{ batchId, courseId }]`
    - Implement `findPracticalSlot(group, existingSchedule, timeSlots)` — finds a free consecutive 2-slot window not already occupied
    - Implement `assignRooms(batches, availableLabRooms, day, slotPair)` — assigns a distinct lab room to each batch; returns error if rooms < batches
    - Implement `generateBatchAssignments()` — orchestrates the above and returns `batch_assignment` records
    - _Requirements: 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3_

  - [ ]* 3.2 Write property test for rotation bijection per week (Property 9)
    - `// Feature: batch-practical-scheduling, Property 9: Rotation bijection per week`
    - For any N batches and N courses, `buildRotationMatrix` output for any single week must be a bijection
    - Use `fast-check`, minimum 100 runs
    - _Requirements: 3.1, 3.2_

  - [ ]* 3.3 Write property test for full rotation coverage (Property 10)
    - `// Feature: batch-practical-scheduling, Property 10: Full rotation coverage`
    - For any N batches and N courses, after N weeks every (batch, course) pair appears exactly once
    - _Requirements: 3.3_

  - [ ]* 3.4 Write property test for rotation group same-slot invariant (Property 7)
    - `// Feature: batch-practical-scheduling, Property 7: Rotation group same-slot invariant`
    - All batch_assignments in the same rotation group and week share the same day and time_slot
    - _Requirements: 2.4, 3.4_

  - [ ]* 3.5 Write property test for distinct rooms per practical slot (Property 11)
    - `// Feature: batch-practical-scheduling, Property 11: Distinct rooms per practical slot`
    - No two batch_assignments in the same slot share the same room_id
    - _Requirements: 3.5_

  - [ ]* 3.6 Write property test for no double-booking (Property 12)
    - `// Feature: batch-practical-scheduling, Property 12: No double-booking`
    - No two entries share the same (room_id, day, time_slot), (faculty_id, day, time_slot), or (batch_id, day, time_slot)
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 3.7 Write property test for rotation group size mismatch error (Property 8)
    - `// Feature: batch-practical-scheduling, Property 8: Rotation group size mismatch error`
    - When |courses| ≠ |batches|, generateBatchAssignments returns a descriptive error and no assignments
    - _Requirements: 2.5_

  - [ ]* 3.8 Write unit tests for BatchPracticalScheduler edge cases
    - Single batch / single course
    - No available lab rooms (returns error)
    - No free consecutive slot (returns warning, skips group)
    - _Requirements: 4.4_

- [ ] 4. Checkpoint — ensure all scheduler tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Backend: batchController and routes
  - [ ] 5.1 Create `backend/src/controllers/batchController.js`
    - `createBatch`: validate name (non-empty, ≤20 chars), department, semester; insert into `batches`; return 400 on duplicate or invalid input
    - `getBatches`: query `batches` filtered by `department` and `semester` query params
    - `updateBatch`: update `name` by id; return 404 if not found
    - `deleteBatch`: delete by id (cascade handles assignments); return 404 if not found
    - `getBatchAssignments`: query `batch_assignments` by `batch_id`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 5.2 Create `backend/src/routes/batches.js` and register it in `backend/src/index.js`
    - `POST /api/batches` → authenticate + authorize('admin') + createBatch
    - `GET /api/batches` → authenticate + getBatches
    - `PUT /api/batches/:id` → authenticate + authorize('admin') + updateBatch
    - `DELETE /api/batches/:id` → authenticate + authorize('admin') + deleteBatch
    - `GET /api/batches/:id/assignments` → authenticate + getBatchAssignments
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 5.3 Write property test for batch CRUD round-trip (Property 1)
    - `// Feature: batch-practical-scheduling, Property 1: Batch CRUD round-trip`
    - For any valid (name, department, semester), create then list should include the created batch
    - Use `fast-check` with mocked Supabase client
    - _Requirements: 1.1, 1.2, 8.1, 8.2_

  - [ ]* 5.4 Write property test for batch update round-trip (Property 2)
    - `// Feature: batch-practical-scheduling, Property 2: Batch update round-trip`
    - For any existing batch and valid new name, update then fetch returns new name
    - _Requirements: 1.3, 8.3_

  - [ ]* 5.5 Write property test for batch delete cascade (Property 3)
    - `// Feature: batch-practical-scheduling, Property 3: Batch delete cascade`
    - After deleting a batch, it no longer appears in list and its assignments are gone
    - _Requirements: 1.4, 8.4, 9.3_

  - [ ]* 5.6 Write property test for duplicate batch rejection (Property 4)
    - `// Feature: batch-practical-scheduling, Property 4: Duplicate batch rejection`
    - Creating a batch with the same (name, department, semester) returns an error
    - _Requirements: 1.5, 9.4_

  - [ ]* 5.7 Write property test for batch name validation (Property 5)
    - `// Feature: batch-practical-scheduling, Property 5: Batch name validation`
    - Empty strings and strings >20 chars are rejected; valid strings succeed
    - _Requirements: 1.6_

  - [ ]* 5.8 Write property test for API 400 on invalid input (Property 16)
    - `// Feature: batch-practical-scheduling, Property 16: API 400 on invalid input`
    - Any request missing name, department, or semester returns HTTP 400
    - _Requirements: 8.6_

  - [ ]* 5.9 Write property test for API 404 on missing resource (Property 17)
    - `// Feature: batch-practical-scheduling, Property 17: API 404 on missing resource`
    - Any request referencing a non-existent batch id returns HTTP 404
    - _Requirements: 8.7_

- [ ] 6. Checkpoint — ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Integrate BatchPracticalScheduler into timetableController
  - [ ] 7.1 Update `generateTimetable` in `backend/src/controllers/timetableController.js`
    - After `TimetableService.generate()`, fetch batches for the department/semester from Supabase
    - Fetch practical courses (course_type = 'lab' or 'practical') with their `rotation_group`
    - Instantiate `BatchPracticalScheduler` and call `generateBatchAssignments()`
    - On error from scheduler (mismatch, no rooms), return 400 with the error message
    - Delete existing `batch_assignments` for the department/semester before inserting new ones
    - Insert generated batch_assignments into Supabase
    - Include `batch_assignment_count` in the response stats
    - _Requirements: 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3_

  - [ ] 7.2 Update `getTimetable` to join batch_assignments into the response
    - For each timetable entry that is a practical course, attach the list of batch_assignments for that slot
    - _Requirements: 6.1, 6.2_

  - [ ] 7.3 Update `getFacultyTimetable` to include batch name in practical course entries
    - Join batch_assignments on course_id and time_slot to attach batch name
    - _Requirements: 7.1_

- [ ] 8. Checkpoint — ensure integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Frontend: API client extensions
  - [ ] 9.1 Add batch API functions to `src/lib/api.ts`
    - `fetchBatches(department, semester)` → GET /api/batches
    - `createBatch(payload)` → POST /api/batches
    - `updateBatch(id, payload)` → PUT /api/batches/:id
    - `deleteBatch(id)` → DELETE /api/batches/:id
    - `fetchBatchAssignments(batchId)` → GET /api/batches/:id/assignments
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10. Frontend: TimetableGridView multi-batch cell rendering
  - [ ] 10.1 Update `TimetableGridView.tsx` to render multi-batch cells
    - When `cell.batchAssignments` is present and non-empty, render a stacked list of batch sub-entries (batch name, course name, room) instead of the single-entry layout
    - When `cell.batchName` is present (student view), render it as a badge below the course name
    - When `cell.batchAssignments` is empty and `cell.type === 'lab'`, render an "Unassigned" label
    - _Requirements: 5.2, 5.3, 6.1, 6.2_

  - [ ]* 10.2 Write property test for cell rendering completeness (Property 14)
    - `// Feature: batch-practical-scheduling, Property 14: Cell rendering completeness`
    - For any BatchAssignmentCell, the rendered output contains course name, faculty name, room, and batch name
    - Use `@fast-check/vitest`
    - _Requirements: 5.2, 6.2, 7.1_

  - [ ]* 10.3 Write property test for admin cell shows all batch entries (Property 15)
    - `// Feature: batch-practical-scheduling, Property 15: Admin cell shows all batch entries`
    - For any array of N BatchAssignmentCell objects, the rendered cell contains exactly N batch sub-entries
    - _Requirements: 6.1_

  - [ ]* 10.4 Write property test for practical course classification (Property 6)
    - `// Feature: batch-practical-scheduling, Property 6: Practical course classification`
    - isPracticalCourse returns true iff course_type is 'lab' or 'practical'
    - _Requirements: 2.2_

- [ ] 11. Frontend: Student timetable batch filtering
  - [ ] 11.1 Update `src/pages/student/StudentTimetable.tsx`
    - Read the student's batch from user profile (add `batch_id` to `User` type and `AuthContext`)
    - When transforming timetable rows, for practical slots filter to only the batch_assignment matching the student's batch_id
    - Populate `cell.batchName` from the matched assignment
    - When no batch is assigned, set `cell.batchName` to "Unassigned"
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 11.2 Write property test for student timetable batch filter (Property 13)
    - `// Feature: batch-practical-scheduling, Property 13: Student timetable batch filter`
    - For any student with batch B, the transformed grid contains only batch_assignments where batch_id === B.id
    - _Requirements: 5.1_

- [ ] 12. Frontend: Admin BatchManagement page
  - [ ] 12.1 Create `src/pages/admin/BatchManagement.tsx`
    - Department + semester selectors (reuse existing pattern from TimetableView)
    - Table listing batches with name, created_at, and action buttons (rename, delete)
    - "Add Batch" form with name input (client-side validation: non-empty, ≤20 chars)
    - Inline rename with optimistic update
    - Delete with confirmation dialog (reuse `alert-dialog` component)
    - Use `useQuery` / `useMutation` from `@tanstack/react-query`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 12.2 Add "Batch Management" link to `src/components/layout/Sidebar.tsx` under admin navigation
    - _Requirements: 1.1_

- [ ] 13. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (backend) and `@fast-check/vitest` (frontend), minimum 100 iterations each
- The `buildRotationMatrix` function should produce a Latin square — a simple cyclic shift (offset by week index) is sufficient and deterministic
- The `batch_id` field on the `User` type requires a corresponding column on the `users` table in Supabase; add this as part of task 1
