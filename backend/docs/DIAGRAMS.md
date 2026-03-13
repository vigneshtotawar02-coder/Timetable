# System Diagrams

## Class Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER CLASSES                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      User        │
├──────────────────┤
│ - id: UUID       │
│ - email: string  │
│ - name: string   │
│ - role: enum     │
│ - department: str│
├──────────────────┤
│ + register()     │
│ + login()        │
│ + logout()       │
│ + getProfile()   │
└────────┬─────────┘
         │
    ┌────┴────┬────────────┐
    │         │            │
┌───▼───┐ ┌──▼────┐ ┌─────▼─────┐
│ Admin │ │Faculty│ │  Student  │
├───────┤ ├───────┤ ├───────────┤
│roles  │ │courses│ │department │
├───────┤ ├───────┤ ├───────────┤
│manage │ │setAvai│ │viewTime   │
│create │ │labilit│ │table()    │
│generat│ │y()    │ │           │
│eTime  │ │viewSch│ │           │
│table()│ │edule()│ │           │
└───────┘ └───────┘ └───────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      COURSE MANAGEMENT                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐        ┌──────────────────┐
│     Course       │        │  FacultyAvail    │
├──────────────────┤        ├──────────────────┤
│ - id: int        │        │ - id: int        │
│ - name: string   │        │ - faculty_id: UUID│
│ - department: str│◄───────┤ - day: string    │
│ - semester: int  │        │ - time_slot: int │
│ - faculty_id: UUID│       │ - available: bool│
│ - weekly_hours:int│       ├──────────────────┤
├──────────────────┤        │ + create()       │
│ + create()       │        │ + update()       │
│ + update()       │        │ + bulkCreate()   │
│ + delete()       │        └──────────────────┘
│ + getAll()       │
└────────┬─────────┘
         │
         │ uses
         ▼
┌──────────────────┐
│   TimeSlot       │
├──────────────────┤
│ - id: int        │
│ - day: string    │
│ - start_time: time│
│ - end_time: time │
├──────────────────┤
│ + create()       │
│ + getAll()       │
└──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TIMETABLE GENERATION                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│           TimetableService                        │
├──────────────────────────────────────────────────┤
│ - courses: Course[]                              │
│ - facultyAvailability: FacultyAvail[]            │
│ - rooms: Room[]                                  │
│ - timeSlots: TimeSlot[]                          │
│ - schedule: TimetableEntry[]                     │
│ - facultySchedule: Map                           │
│ - roomSchedule: Map                              │
├──────────────────────────────────────────────────┤
│ + generate(): TimetableEntry[]                   │
│ + calculateRequirements(): Requirement[]         │
│ + generateWithBacktracking(index): boolean       │
│ + findBestSlot(course, existing): Assignment     │
│ + isValidAssignment(course, room, slot): bool    │
│ + calculateAssignmentScore(...): number          │
│ + applyAssignment(assignment): void              │
│ + rollbackAssignments(assignments): void         │
└──────────────────────────────────────────────────┘
         │
         │ generates
         ▼
┌──────────────────┐
│   Timetable      │
├──────────────────┤
│ - id: int        │
│ - course_id: int │
│ - faculty_id: UUID│
│ - room_id: int   │
│ - day: string    │
│ - time_slot: int │
│ - semester: int  │
│ - department: str│
├──────────────────┤
│ + generate()     │
│ + getByDept()    │
│ + getByFaculty() │
│ + delete()       │
└──────────────────┘

┌──────────────────┐
│      Room        │
├──────────────────┤
│ - id: int        │
│ - name: string   │
│ - capacity: int  │
├──────────────────┤
│ + create()       │
│ + getAll()       │
│ + update()       │
│ + delete()       │
└──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        ANALYTICS                                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│         AnalyticsService                  │
├──────────────────────────────────────────┤
│ + getFacultyWorkload(): WorkloadStats    │
│ + getRoomUtilization(): UtilizationStats │
│ + getDepartmentOverview(): Overview      │
└──────────────────────────────────────────┘
```

## Sequence Diagram: Generate Timetable

```
Client          Controller      Service         Database
  │                 │              │               │
  │─────POST /generate────────────►│               │
  │                 │              │               │
  │                 │──validate────┤               │
  │                 │              │               │
  │                 │──fetch data──────────────────►│
  │                 │              │               │
  │                 │◄─────courses, rooms, etc.────┤
  │                 │              │               │
  │                 │──new TimetableService()─────►│
  │                 │              │               │
  │                 │              │──generate()   │
  │                 │              │               │
  │                 │              │  ┌─────────┐  │
  │                 │              │  │Calculate│  │
  │                 │              │  │Required │  │
  │                 │              │  │Classes  │  │
  │                 │              │  └────┬────┘  │
  │                 │              │       │       │
  │                 │              │  ┌────▼────┐  │
  │                 │              │  │Greedy + │  │
  │                 │              │  │Backtrack│  │
  │                 │              │  │Algorithm│  │
  │                 │              │  └────┬────┘  │
  │                 │              │       │       │
  │                 │              │  ┌────▼────┐  │
  │                 │              │  │Validate │  │
  │                 │              │  │Constra- │  │
  │                 │              │  │ints     │  │
  │                 │              │  └────┬────┘  │
  │                 │              │       │       │
  │                 │              │◄──timetable   │
  │                 │              │               │
  │                 │──save timetable──────────────►│
  │                 │              │               │
  │                 │◄─────success─────────────────┤
  │                 │              │               │
  │◄────201 Created w/ timetable───┤               │
  │                 │              │               │
```

## Data Flow Diagram

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │
       │ HTTP Request
       ▼
┌─────────────────────────────────────┐
│        API Gateway                   │
│  (Express + Middleware)              │
│  ┌────────────────────────────────┐ │
│  │ 1. CORS                        │ │
│  │ 2. Authentication (JWT)        │ │
│  │ 3. Authorization (Role)        │ │
│  │ 4. Validation (Input)          │ │
│  └────────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│         Router                        │
│  Maps URL to Controller               │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│        Controller                     │
│  • Parse request                      │
│  • Call service                       │
│  • Format response                    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│         Service Layer                 │
│  • Business Logic                     │
│  • AI Algorithm (Timetable)           │
│  • Data Processing                    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│     Data Access Layer                 │
│  (Supabase Client)                    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│        Database                       │
│  (PostgreSQL via Supabase)            │
│  ┌────────────────────────────────┐  │
│  │ Tables:                        │  │
│  │ • users                        │  │
│  │ • courses                      │  │
│  │ • rooms                        │  │
│  │ • time_slots                   │  │
│  │ • faculty_availability         │  │
│  │ • timetable                    │  │
│  └────────────────────────────────┘  │
└───────────────────────────────────────┘
```

## Algorithm Flowchart

```
           START
             │
             ▼
    ┌────────────────┐
    │ Input Data:    │
    │ • Courses      │
    │ • Faculty Avail│
    │ • Rooms        │
    │ • Time Slots   │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │ Initialize     │
    │ Tracking Struct│
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │ Calculate      │
    │ Requirements   │
    │ (Classes Needed)│
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │ For Each Course│◄─────┐
    └────────┬───────┘      │
             │               │
             ▼               │
    ┌────────────────┐      │
    │ For Each Class │      │
    │ Needed         │      │
    └────────┬───────┘      │
             │               │
             ▼               │
    ┌────────────────┐      │
    │ Find Best Slot │      │
    │ (Greedy)       │      │
    └────────┬───────┘      │
             │               │
         ┌───▼───┐           │
         │ Found?│           │
         └───┬───┘           │
          No │ Yes           │
    ┌────────┼────────┐      │
    │        │        │      │
    ▼        ▼        ▼      │
┌──────┐ ┌────────┐ ┌────┐  │
│Back- │ │Validate│ │Next│  │
│track │ │Constra-│ │Cour│──┘
│      │ │ints?   │ │se  │
└──┬───┘ └───┬────┘ └────┘
   │      Yes│  No
   │         ▼
   │    ┌────────┐
   │    │ Apply  │
   │    │Assignmt│
   │    └───┬────┘
   │        │
   │        ▼
   │   ┌────────┐
   │   │Continue│
   └───►│        │
       └───┬────┘
           │
      ┌────▼─────┐
      │All Done? │
      └────┬─────┘
        No │ Yes
           │
           ▼
       ┌────────┐
       │ Return │
       │Timetabl│
       └───┬────┘
           │
           ▼
          END
```

## Constraint Satisfaction Diagram

```
┌─────────────────────────────────────────┐
│         HARD CONSTRAINTS                 │
│         (Must Satisfy)                   │
├─────────────────────────────────────────┤
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 1. No Faculty Overlap           │    │
│  │    faculty[slot] != occupied    │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 2. No Room Overlap              │    │
│  │    room[slot] != occupied       │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 3. Faculty Available            │    │
│  │    availability[faculty][slot]  │    │
│  │         == true                 │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 4. Weekly Hours Met             │    │
│  │    scheduled_hours >=           │    │
│  │         required_hours          │    │
│  └─────────────────────────────────┘    │
│                                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         SOFT CONSTRAINTS                 │
│         (Should Satisfy)                 │
├─────────────────────────────────────────┤
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 5. No Consecutive Classes       │    │
│  │    Prefer gaps between classes  │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 6. Distributed Schedule         │    │
│  │    Spread across days           │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 7. Workload Balance             │    │
│  │    Even distribution            │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 8. Prefer Morning Slots         │    │
│  │    8 AM - 12 PM preferred       │    │
│  └─────────────────────────────────┘    │
│                                          │
└─────────────────────────────────────────┘
```

## Database ER Diagram

```
        ┌─────────┐
        │  users  │
        ├─────────┤
        │ id (PK) │
        │ email   │
        │ name    │
        │ role    │
        │ dept    │
        └────┬────┘
             │
      ┏━━━━━━┻━━━━━━━┓
      ▼               ▼
┌──────────┐   ┌───────────────┐
│ courses  │   │faculty_availab│
├──────────┤   ├───────────────┤
│id (PK)   │   │id (PK)        │
│name      │   │faculty_id (FK)│
│dept      │   │day            │
│semester  │   │time_slot (FK) │
│faculty_id│   │available      │
│weekly_hrs│   └───────────────┘
└────┬─────┘
     │
     │ referenced by
     ▼
┌──────────┐
│timetable │
├──────────┤
│id (PK)   │
│course_id │──────┐
│faculty_id│      │
│room_id   │──┐   │
│day       │  │   │
│time_slot │──┼───┼───┐
│semester  │  │   │   │
│dept      │  │   │   │
└──────────┘  │   │   │
              │   │   │
              │   │   │
        ┌─────▼───┴───▼─────┐
        │                   │
   ┌────▼────┐      ┌───────▼────┐
   │  rooms  │      │ time_slots │
   ├─────────┤      ├────────────┤
   │id (PK)  │      │id (PK)     │
   │name     │      │day         │
   │capacity │      │start_time  │
   └─────────┘      │end_time    │
                    └────────────┘
```

---

*These diagrams provide a visual representation of the system architecture, data flow, and algorithm logic.*
