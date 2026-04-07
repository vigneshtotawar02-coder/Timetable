# AI-Based Timetable Generation System

A full-stack web application that automates academic timetable scheduling using AI-driven constraint satisfaction algorithms. It generates conflict-free timetables for educational institutions while respecting faculty availability, room capacity, course requirements, and workload distribution.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Features by Role](#features-by-role)
   - [Admin Features](#admin-features)
   - [Faculty Features](#faculty-features)
   - [Student Features](#student-features)
5. [AI Timetable Generation Algorithm](#ai-timetable-generation-algorithm)
6. [Batch Practical Scheduling](#batch-practical-scheduling)
7. [Database Schema](#database-schema)
8. [API Reference](#api-reference)
9. [Authentication & Authorization](#authentication--authorization)
10. [Analytics & Reporting](#analytics--reporting)
11. [Environment Setup](#environment-setup)
12. [Running the Project](#running-the-project)

---

## Project Overview

Educational institutions face significant challenges when creating timetables manually — it's time-consuming, error-prone, and hard to optimize. This system solves that by:

- Automatically generating conflict-free schedules using a CSP (Constraint Satisfaction Problem) solver
- Respecting hard constraints like faculty availability, room capacity, and no double-booking
- Handling both lecture and lab courses with different scheduling rules
- Supporting batch rotation for practical/lab sessions
- Providing role-based dashboards for admins, faculty, and students

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.19 | Build tool |
| TailwindCSS | 3.4.17 | Styling |
| shadcn/ui + Radix UI | - | Component library |
| React Router | 6.30.1 | Client-side routing |
| TanStack React Query | 5.83.0 | Server state management |
| Axios | 1.13.5 | HTTP client |
| React Hook Form + Zod | 7.61.1 / 3.25.76 | Form handling & validation |
| Recharts | 2.15.4 | Charts and analytics |
| html2canvas + jsPDF | - | PDF export |
| Lucide React | - | Icons |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | v16+ | Runtime |
| Express.js | 4.18.2 | Web framework |
| Supabase (PostgreSQL) | 2.39.3 | Database + Auth |
| JWT | 9.0.2 | Token-based auth |
| express-validator | 7.0.1 | Input validation |
| Winston | 3.11.0 | Logging |
| CORS | 2.8.5 | Cross-origin support |
| dotenv | 16.4.1 | Environment config |

---

## Project Structure

```
├── src/                          # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── layout/               # AppLayout, navigation wrappers
│   │   └── ui/                   # shadcn/ui components + custom (TimetableGridView, StatCard)
│   ├── contexts/
│   │   └── AuthContext.tsx       # Global auth state (user, login, logout)
│   ├── hooks/                    # use-mobile, use-toast
│   ├── lib/
│   │   ├── api.ts                # All API calls (axios instance + endpoints)
│   │   ├── mockData.ts           # Static data (departments, semesters)
│   │   └── utils.ts              # Utility helpers
│   ├── pages/
│   │   ├── admin/                # 8 admin pages
│   │   ├── faculty/              # 2 faculty pages
│   │   ├── student/              # 2 student pages
│   │   └── auth/                 # Login, Register
│   └── types/index.ts            # TypeScript interfaces
│
├── backend/                      # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/               # Supabase client, Winston logger
│   │   ├── controllers/          # Request handlers (8 controllers)
│   │   ├── middleware/           # Auth, error handler, validator
│   │   ├── routes/               # Express route definitions
│   │   ├── services/
│   │   │   ├── timetableService.js        # Core AI scheduling algorithm
│   │   │   └── batchPracticalScheduler.js # Batch rotation for labs
│   │   └── utils/                # AppError, asyncHandler
│   └── database/
│       ├── schema.sql            # Full PostgreSQL schema
│       └── migrations/           # Incremental schema changes
```

---

## Features by Role

### Admin Features

#### Dashboard
The admin dashboard provides a high-level overview of the system. It shows live stats for total courses, rooms, and faculty workload pulled via React Query. A bar chart visualizes faculty teaching hours at a glance. There's also a quick-action button to trigger timetable generation directly from the dashboard.

#### Course Management (`/admin/courses`)
- Full CRUD for courses — create, view, edit, and delete
- Each course has: name, department, semester, assigned faculty, weekly hours, and course type (lecture/lab/seminar)
- Filter courses by department and semester
- Faculty assignment links courses to specific faculty members for scheduling

#### Faculty Management (`/admin/faculty`)
- View all registered faculty members
- See faculty details: name, email, department
- Manage faculty accounts and their course assignments

#### Classroom Management (`/admin/classrooms`)
- Add, edit, and delete rooms
- Each room has a name and capacity
- Rooms are used by the scheduling algorithm to assign venues to classes
- Room type (lecture hall, lab, seminar room) influences which courses get assigned there

#### Time Slot Configuration (`/admin/timeslots`)
- Define the available time periods for scheduling (e.g., 9:00–10:00, 10:00–11:00)
- Set which days are working days (Monday–Saturday)
- Time slots are the building blocks the algorithm uses to place classes

#### Timetable Generation & View (`/admin/timetable`)
- Select a department and semester, then trigger AI-based timetable generation
- The algorithm runs on the backend and returns a conflict-free schedule
- View the generated timetable in a grid format (days as columns, time slots as rows)
- Each cell shows: course name, faculty name, room, and course type badge
- Lab slots show batch assignments — which batch is in which room
- Download the timetable as a PDF using html2canvas + jsPDF
- Regenerate the timetable at any time (replaces the existing one)

#### Batch Management (`/admin/batches`)
- Create and manage student batches (e.g., Batch A, Batch B, Batch C) per department and semester
- Rename or delete batches
- Batches are used for practical/lab scheduling rotation

#### Analytics (`/admin/analytics`)
- Faculty Workload chart: bar chart showing total teaching hours per faculty member, with average workload line
- Room Utilization chart: pie/bar chart showing how often each room is used as a percentage
- Department Overview: summary stats per department (courses, faculty, scheduled hours)
- Weekly Trend chart: line/area chart showing timetables generated and conflicts over time

---

### Faculty Features

#### Faculty Dashboard (`/faculty/dashboard`)
- Personalized welcome with the faculty member's name and department
- Summary cards showing assigned courses, total weekly teaching hours, and upcoming classes
- Quick view of today's schedule

#### Faculty Timetable (`/faculty/timetable`)
- Displays the faculty member's personal teaching schedule in a weekly grid
- Automatically fetches schedule based on the logged-in faculty's ID
- Shows course name, room, and time for each assigned slot
- Summary stats: total courses, unique rooms, total time slots
- Download schedule as PDF

---

### Student Features

#### Student Dashboard (`/student/dashboard`)
- Personalized overview showing the student's department, semester, and batch
- Summary of enrolled courses and upcoming classes

#### Student Timetable (`/student/timetable`)
- Displays the weekly class schedule for the student's department and semester
- For lab/practical slots, shows the student's specific batch assignment — which room and which lab course their batch has that week
- Summary stats: total courses, faculty count, rooms used
- Download timetable as PDF

---

## AI Timetable Generation Algorithm

The core scheduling engine is in `backend/src/services/timetableService.js`. It models the problem as a **Constraint Satisfaction Problem (CSP)** and solves it using a combination of three techniques:

### 1. Greedy Algorithm (Initial Assignment)
The algorithm starts by sorting courses — lab courses are prioritized first so they claim time slots before lectures fill them up. For each course, it greedily picks the "best" available slot based on a scoring function that considers:
- Faculty availability at that time
- Whether the room is free
- No existing conflict for the course on that day
- Preference for earlier (morning) slots
- Avoiding consecutive slots for the same course

### 2. Backtracking (Conflict Resolution)
If a course cannot be fully scheduled (not enough valid slots found), the algorithm logs a warning and moves on rather than failing entirely. The recursive `generateWithBacktracking()` function processes courses one by one, and each course tries to fill all its required weekly slots before moving to the next.

### 3. Constraint Satisfaction
At every slot assignment, the algorithm checks all hard constraints:

**Hard Constraints (must all pass):**
- A faculty member cannot be in two places at once (`facultySchedule` map)
- A room cannot host two classes at the same time (`roomSchedule` map)
- Faculty must be marked as available for that day/time slot
- Each course must reach its required weekly hours

**Soft Constraints (scored, not enforced):**
- Distribute classes across the week (avoid clustering on one day)
- Avoid scheduling the same course in consecutive time slots
- Balance faculty workload evenly

### Algorithm Complexity
- Time: O(C × T × F) where C = courses, T = time slots, F = faculty
- Space: O(F × T + R × T) for tracking faculty and room bookings

---

## Database Schema

The PostgreSQL database (hosted on Supabase) has the following tables:

| Table | Description |
|---|---|
| `users` | All users — admin, faculty, student. UUID primary key, role-based. |
| `courses` | Course catalog with faculty assignment, weekly hours, course type, department, semester. |
| `rooms` | Available classrooms with name and capacity. |
| `time_slots` | Scheduling periods — day, start time, end time. Unique per day+start_time. |
| `faculty_availability` | Per-faculty availability for each day/time slot combination. |
| `timetable` | Generated schedule entries. Each row = one class session (course + faculty + room + day + slot). Unique constraints prevent double-booking. |
| `batches` | Student batch groups per department and semester. |
| `batch_assignments` | Maps batches to lab courses with room and week number for rotation tracking. |

Key design decisions:
- `timetable` has unique constraints on `(faculty_id, day, time_slot)` and `(room_id, day, time_slot)` to enforce no-conflict at the DB level
- Row Level Security (RLS) policies restrict data access by role
- A `timetable_view` joins all related tables for easy querying
- Triggers auto-update `updated_at` timestamps
- Indexed columns on department, semester, faculty_id for fast filtering

---

## API Reference

Base URL: `https://timetable-vmbl.onrender.com/api`

All protected routes require `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login and receive JWT |
| GET | `/auth/me` | Private | Get current user profile |
| PUT | `/auth/profile` | Private | Update user profile |

### Courses
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/courses` | Private | List all courses (filterable by dept/semester) |
| POST | `/courses` | Admin | Create a new course |
| PUT | `/courses/:id` | Admin | Update a course |
| DELETE | `/courses/:id` | Admin | Delete a course |

### Timetable
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/timetable/generate` | Admin | Generate timetable for dept + semester |
| GET | `/timetable/:dept/:semester` | Private | Fetch timetable grid |
| GET | `/timetable/faculty/:id` | Private | Fetch a faculty member's schedule |
| DELETE | `/timetable/:dept/:semester` | Admin | Delete generated timetable |

### Rooms
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/rooms` | Private | List all rooms |
| POST | `/rooms` | Admin | Add a room |
| PUT | `/rooms/:id` | Admin | Update a room |
| DELETE | `/rooms/:id` | Admin | Delete a room |

### Time Slots
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/time-slots` | Private | List all time slots |
| POST | `/time-slots` | Admin | Create a time slot |
| DELETE | `/time-slots/:id` | Admin | Delete a time slot |

### Faculty Availability
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/faculty-availability/:facultyId` | Private | Get availability for a faculty |
| POST | `/faculty-availability` | Faculty/Admin | Set availability |
| PUT | `/faculty-availability/bulk` | Faculty/Admin | Bulk update availability |

### Analytics
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/analytics/faculty-workload` | Admin | Faculty teaching hours |
| GET | `/analytics/room-utilization` | Admin | Room usage percentages |
| GET | `/analytics/department-overview` | Admin | Per-department summary |

### Batches
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/batches` | Private | List batches (filter by dept/semester) |
| POST | `/batches` | Admin | Create a batch |
| PUT | `/batches/:id` | Admin | Rename a batch |
| DELETE | `/batches/:id` | Admin | Delete a batch |
| GET | `/batches/assignments` | Private | Get batch lab assignments |

### Response Format
All responses follow this structure:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

---

## Authentication & Authorization

### Frontend
- Auth state is managed via React Context (`AuthContext.tsx`)
- On login, the JWT access token is stored in `localStorage` as `tt_token` and user info as `tt_user`
- The Axios instance automatically attaches the token to every request via a request interceptor
- `useAuth()` hook provides `user`, `login`, `logout`, and `updateUser` throughout the app
- Route protection is handled by `AppLayout` which checks `requiredRole` against the logged-in user's role

### Backend
- `authenticate` middleware verifies the Bearer JWT token using Supabase Auth
- `authorize(...roles)` middleware restricts endpoints to specific roles (admin, faculty, student)
- User data is attached to `req.user` for downstream handlers
- Supabase handles password hashing (bcrypt) and token generation

### User Roles
| Role | Capabilities |
|---|---|
| `admin` | Full access — manage courses, rooms, time slots, faculty, batches, generate timetables, view analytics |
| `faculty` | View own timetable, manage own availability |
| `student` | View department/semester timetable with batch-specific lab assignments |

---

## Analytics & Reporting

The analytics module (`analyticsController.js` + `Analytics.tsx`) provides:

- **Faculty Workload**: Bar chart of total weekly teaching hours per faculty. Shows average workload as a reference line. Helps identify overloaded or underutilized faculty.
- **Room Utilization**: Pie/bar chart showing each room's usage as a percentage of total available slots. Helps identify underused rooms.
- **Department Overview**: Aggregated stats per department — number of courses, faculty count, total scheduled hours.
- **Weekly Trend**: Line/area chart tracking how many timetables were generated and how many conflicts occurred week over week.

---

## Environment Setup

### Frontend (root `.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

---

## Running the Project

### Prerequisites
- Node.js v16+
- A Supabase project with the schema from `backend/database/schema.sql` applied

### Backend
```bash
cd backend
npm install
npm run dev        # development with nodemon
npm start          # production
```

### Frontend
```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # Production build
npm run preview    # Preview production build
```

### Running Tests
```bash
# Frontend unit tests
npm run test

# Backend tests
cd backend && npm test
```