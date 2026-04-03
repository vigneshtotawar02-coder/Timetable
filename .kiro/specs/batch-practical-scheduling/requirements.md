# Requirements Document

## Introduction

This feature adds batch-based practical lab scheduling to the existing timetable system. Students in a semester are divided into named batches (e.g., B1, B2, B3). During a designated practical lab time slot, all batches are scheduled simultaneously in the same time window, but each batch is assigned a different practical subject and lab room. The rotation is managed so that every batch completes all required practicals over the course of the schedule cycle. The feature extends the existing timetable generation engine, data model, API, and all timetable views (admin, student, faculty).

## Glossary

- **Batch**: A named subdivision of students within a semester/department (e.g., B1, B2, B3).
- **Practical_Course**: A course of type `lab` or `practical` that requires a lab room and is subject to batch rotation.
- **Batch_Assignment**: A single record linking a Batch to a Practical_Course for a specific time slot and room.
- **Rotation_Cycle**: The ordered sequence of Practical_Course assignments across weeks such that every Batch completes every Practical_Course exactly once.
- **Practical_Slot**: A consecutive pair of time slots (2 hours) designated for simultaneous batch lab sessions.
- **Timetable_Service**: The backend scheduling engine (`timetableService.js`) responsible for generating timetable entries.
- **Timetable_View**: The database view (`timetable_view`) and the frontend grid component (`TimetableGridView`) used to display the schedule.
- **Admin**: A user with role `admin` who manages batches, courses, and timetable generation.
- **Student**: A user with role `student` who belongs to a specific batch and views their personalised timetable.
- **Faculty**: A user with role `faculty` who is assigned to a Practical_Course and views their teaching schedule.

## Requirements

### Requirement 1: Batch Management

**User Story:** As an Admin, I want to define and manage batches for a department and semester, so that students can be organised into groups for practical scheduling.

#### Acceptance Criteria

1. THE Admin SHALL be able to create a Batch with a name, department, and semester.
2. THE Admin SHALL be able to list all Batches for a given department and semester.
3. THE Admin SHALL be able to update a Batch name.
4. THE Admin SHALL be able to delete a Batch, which also removes all associated Batch_Assignments.
5. WHEN a Batch is created with a name that already exists for the same department and semester, THE System SHALL reject the creation and return a descriptive error.
6. WHEN a Batch name is provided, THE System SHALL store it as a non-empty string of at most 20 characters.

### Requirement 2: Practical Course Batch Configuration

**User Story:** As an Admin, I want to mark courses as batch-practical courses and associate them with a rotation group, so that the scheduler knows which courses participate in simultaneous batch scheduling.

#### Acceptance Criteria

1. THE Admin SHALL be able to set a `course_type` of `practical` on any course, in addition to the existing `lab` and `lecture` types.
2. WHEN a course has `course_type` of `lab` or `practical`, THE Timetable_Service SHALL treat it as a Practical_Course eligible for batch scheduling.
3. THE Admin SHALL be able to assign a `rotation_group` identifier to a set of Practical_Courses, indicating they rotate together across Batches.
4. WHEN Practical_Courses share the same `rotation_group`, department, and semester, THE Timetable_Service SHALL schedule them simultaneously in the same Practical_Slot.
5. WHEN the number of Practical_Courses in a rotation group does not equal the number of Batches for that department and semester, THE Timetable_Service SHALL return a descriptive error and halt generation for that group.

### Requirement 3: Batch Rotation Scheduling

**User Story:** As an Admin, I want the timetable generator to automatically assign each batch a different practical subject per slot and rotate assignments across weeks, so that every batch completes all practicals.

#### Acceptance Criteria

1. WHEN the Timetable_Service generates a schedule containing a rotation group, THE Timetable_Service SHALL produce one Batch_Assignment per Batch per rotation cycle week, such that no two Batches are assigned the same Practical_Course in the same week.
2. WHEN generating Batch_Assignments for a rotation cycle, THE Timetable_Service SHALL assign each Practical_Course to exactly one Batch per week.
3. WHEN generating Batch_Assignments, THE Timetable_Service SHALL ensure that after N weeks (where N equals the number of Practical_Courses in the rotation group), every Batch has been assigned every Practical_Course exactly once.
4. WHEN a Practical_Slot is selected for a rotation group, THE Timetable_Service SHALL assign all Batches to that same day and consecutive time window.
5. WHEN assigning rooms for a Practical_Slot, THE Timetable_Service SHALL assign a distinct lab room to each Batch, and SHALL return a descriptive error if insufficient lab rooms are available.

### Requirement 4: Conflict Prevention

**User Story:** As an Admin, I want the scheduler to prevent double-booking of rooms and faculty during batch practical slots, so that the generated timetable is conflict-free.

#### Acceptance Criteria

1. WHEN a lab room is assigned to a Batch for a Practical_Slot, THE Timetable_Service SHALL NOT assign that same room to any other Batch or course in the overlapping time slots.
2. WHEN a faculty member is assigned to a Practical_Course, THE Timetable_Service SHALL NOT schedule that faculty member in any other course during the same Practical_Slot.
3. WHEN a Batch is assigned to a Practical_Slot, THE Timetable_Service SHALL NOT schedule any other course for that Batch in the overlapping time slots.
4. IF a conflict cannot be resolved during generation, THEN THE Timetable_Service SHALL log a warning and skip the conflicting assignment rather than producing an invalid schedule.

### Requirement 5: Student Timetable View

**User Story:** As a Student, I want to see my batch's practical assignments in my timetable, so that I know which lab I attend and when.

#### Acceptance Criteria

1. WHEN a Student views their timetable, THE Timetable_View SHALL display only the Practical_Course assigned to that Student's Batch for each Practical_Slot.
2. WHEN displaying a Practical_Slot entry, THE Timetable_View SHALL show the Practical_Course name, assigned faculty name, assigned lab room, and the Student's Batch name.
3. WHEN a Student has no Batch assigned, THE Timetable_View SHALL display the Practical_Slot as unassigned with a descriptive label.
4. WHEN a Student's Batch assignment changes, THE Timetable_View SHALL reflect the updated assignment upon the next data fetch.

### Requirement 6: Admin Timetable View

**User Story:** As an Admin, I want to see all batch assignments for a practical slot in the timetable grid, so that I can verify the rotation is correct.

#### Acceptance Criteria

1. WHEN an Admin views the timetable grid for a department and semester, THE Timetable_View SHALL display all Batch_Assignments for each Practical_Slot grouped within the same time cell.
2. WHEN displaying a Practical_Slot cell in the admin view, THE Timetable_View SHALL show each Batch name alongside its assigned Practical_Course name and room.
3. WHEN a Practical_Slot has no Batch_Assignments, THE Timetable_View SHALL render the cell as empty.

### Requirement 7: Faculty Timetable View

**User Story:** As a Faculty member, I want to see which batch I am teaching during each practical slot, so that I can prepare accordingly.

#### Acceptance Criteria

1. WHEN a Faculty member views their timetable, THE Timetable_View SHALL display each Practical_Course entry with the Batch name of the students they are teaching that week.
2. WHEN a Faculty member is assigned to a Practical_Course that rotates across Batches, THE Timetable_View SHALL show the current week's Batch assignment.

### Requirement 8: Batch Assignment API

**User Story:** As a developer, I want REST API endpoints for batch and batch-assignment management, so that the frontend can create, read, update, and delete batch data.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/batches` endpoint that creates a Batch and returns the created record.
2. THE API SHALL expose a `GET /api/batches` endpoint that returns all Batches, filterable by department and semester query parameters.
3. THE API SHALL expose a `PUT /api/batches/:id` endpoint that updates a Batch name and returns the updated record.
4. THE API SHALL expose a `DELETE /api/batches/:id` endpoint that deletes a Batch and its Batch_Assignments and returns a success message.
5. THE API SHALL expose a `GET /api/batches/:id/assignments` endpoint that returns all Batch_Assignments for a given Batch.
6. WHEN any batch API endpoint receives an invalid or missing required field, THE API SHALL return HTTP 400 with a descriptive error message.
7. WHEN any batch API endpoint references a non-existent Batch id, THE API SHALL return HTTP 404 with a descriptive error message.

### Requirement 9: Data Persistence

**User Story:** As a developer, I want batch and batch-assignment data stored in Supabase, so that the data is durable and queryable.

#### Acceptance Criteria

1. THE System SHALL store Batch records in a `batches` table with columns: `id`, `name`, `department`, `semester`, `created_at`.
2. THE System SHALL store Batch_Assignment records in a `batch_assignments` table with columns: `id`, `batch_id`, `course_id`, `room_id`, `day`, `time_slot`, `week_number`, `department`, `semester`.
3. WHEN a Batch is deleted, THE System SHALL cascade-delete all associated Batch_Assignment records.
4. THE System SHALL enforce a unique constraint on (`name`, `department`, `semester`) in the `batches` table.
5. THE System SHALL enforce a unique constraint on (`batch_id`, `course_id`, `week_number`) in the `batch_assignments` table to prevent duplicate rotation entries.
