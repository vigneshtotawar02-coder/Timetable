# AI-Based Timetable Generation System - Backend

A scalable, intelligent backend system for automated timetable generation using constraint satisfaction algorithms with backtracking and greedy heuristics.

## 🎯 Overview

This system generates conflict-free timetables for educational institutions while respecting various constraints such as faculty availability, room capacity, and workload distribution. The AI algorithm ensures optimal scheduling through a combination of:

- **Constraint Satisfaction Problem (CSP)** approach
- **Greedy Algorithm** for initial slot selection
- **Backtracking** for conflict resolution
- **Heuristic Optimization** for better scheduling decisions

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + JWT
- **Environment**: dotenv
- **CORS**: cors middleware
- **Validation**: express-validator
- **Logging**: winston

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── supabase.js   # Supabase client setup
│   │   └── logger.js     # Winston logger configuration
│   ├── controllers/      # Request handlers
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── timetableController.js
│   │   ├── roomController.js
│   │   ├── timeSlotController.js
│   │   ├── facultyAvailabilityController.js
│   │   └── analyticsController.js
│   ├── middleware/       # Custom middleware
│   │   ├── auth.js       # Authentication & authorization
│   │   ├── errorHandler.js
│   │   └── validator.js  # Input validation
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── timetable.js
│   │   ├── rooms.js
│   │   ├── timeSlots.js
│   │   ├── facultyAvailability.js
│   │   └── analytics.js
│   ├── services/         # Business logic
│   │   └── timetableService.js  # AI generation algorithm
│   ├── utils/            # Utility functions
│   │   ├── AppError.js
│   │   └── asyncHandler.js
│   └── index.js          # Entry point
├── database/
│   └── schema.sql        # Database schema
├── docs/                 # Documentation
│   ├── API.md            # API documentation
│   ├── ARCHITECTURE.md   # Architecture overview
│   ├── ALGORITHM.md      # Timetable algorithm details
│   └── SETUP.md          # Setup guide
├── .env.example
├── .gitignore
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```
   PORT=5000
   NODE_ENV=development
   
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Set up database**
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Copy and execute the SQL from `database/schema.sql`

5. **Create logs directory**
   ```bash
   mkdir -p logs
   ```

6. **Start the server**
   
   Development mode:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

The server will start on `http://localhost:5000`

## 📊 Database Schema

### Tables

1. **users** - Stores all users (admin, faculty, students)
2. **courses** - Course information with faculty assignment
3. **rooms** - Available classrooms and capacities
4. **time_slots** - Defined time slots for scheduling
5. **faculty_availability** - Faculty availability tracking
6. **timetable** - Generated timetable entries

See [database/schema.sql](database/schema.sql) for complete schema.

## 🔐 Authentication & Authorization

The system uses Supabase Auth with JWT tokens:

- **Public routes**: `/api/auth/login`, `/api/auth/register`
- **Protected routes**: All other routes require authentication
- **Role-based access**: 
  - `admin`: Full access to all resources
  - `faculty`: Can manage own availability and view timetables
  - `student`: Can view timetables only

## 🎮 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Courses (Admin only for CUD)
- `POST /api/courses` - Create course
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Timetable
- `POST /api/timetable/generate` - Generate timetable (Admin)
- `GET /api/timetable/:department/:semester` - Get timetable
- `GET /api/timetable/faculty/:id` - Get faculty timetable
- `DELETE /api/timetable/:department/:semester` - Delete timetable (Admin)

### Rooms (Admin only for CUD)
- `POST /api/rooms` - Create room
- `GET /api/rooms` - Get all rooms
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Time Slots (Admin only for CUD)
- `POST /api/time-slots` - Create time slot
- `GET /api/time-slots` - Get all time slots
- `PUT /api/time-slots/:id` - Update time slot
- `DELETE /api/time-slots/:id` - Delete time slot

### Faculty Availability (Admin/Faculty)
- `POST /api/faculty-availability` - Create availability
- `POST /api/faculty-availability/bulk` - Bulk create availability
- `GET /api/faculty-availability/:faculty_id` - Get faculty availability
- `PUT /api/faculty-availability/:id` - Update availability
- `DELETE /api/faculty-availability/:id` - Delete availability

### Analytics (Admin only)
- `GET /api/analytics/faculty-workload` - Faculty workload statistics
- `GET /api/analytics/room-utilization` - Room utilization statistics
- `GET /api/analytics/department-overview` - Department overview

See [docs/API.md](docs/API.md) for detailed API documentation.

## 🤖 AI Timetable Generation Algorithm

The timetable generation uses a sophisticated constraint satisfaction approach:

### Key Constraints
1. ✅ No overlapping classes for faculty
2. ✅ No double booking of rooms
3. ✅ Faculty availability must be respected
4. ✅ Weekly hours must be fulfilled
5. ✅ Balanced faculty workload
6. ✅ No consecutive classes for same course
7. ✅ Distributed classes throughout the week

### Algorithm Steps
1. **Calculate Requirements** - Determine how many classes each course needs
2. **Greedy Selection** - Find best available slot using heuristics
3. **Constraint Validation** - Verify all constraints are satisfied
4. **Backtracking** - If constraints fail, backtrack and try alternative slots
5. **Optimization** - Prefer slots that balance workload and spread classes

See [docs/ALGORITHM.md](docs/ALGORITHM.md) for detailed algorithm explanation.

## 📈 Features

### Core Features
- ✅ User authentication and authorization
- ✅ Role-based access control (Admin, Faculty, Student)
- ✅ CRUD operations for courses, rooms, time slots
- ✅ Faculty availability management
- ✅ AI-powered timetable generation
- ✅ Conflict detection and resolution
- ✅ Timetable visualization endpoints

### Analytics Features
- ✅ Faculty workload analysis
- ✅ Room utilization statistics
- ✅ Department overview metrics
- ✅ Scheduling efficiency reports

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | JWT secret key | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | Yes |

## 🧪 Testing

Test the API using tools like:
- Postman
- Thunder Client (VS Code extension)
- curl

Example request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

## 📝 Logging

The system uses Winston for comprehensive logging:
- **Console logs** - All log levels with colors
- **error.log** - Error level logs only
- **combined.log** - All logs

Logs are stored in the `logs/` directory.

## 🛡️ Security Features

- JWT-based authentication
- Role-based authorization
- Input validation on all endpoints
- SQL injection prevention (using Supabase client)
- Row Level Security (RLS) policies in database
- Environment variable protection
- Error message sanitization

## 🚨 Error Handling

The system includes comprehensive error handling:
- Global error handler middleware
- Custom AppError class for operational errors
- Async error handling wrapper
- Validation error formatting
- 404 not found handler

## 📚 Additional Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [Architecture Guide](docs/ARCHITECTURE.md) - System architecture
- [Algorithm Details](docs/ALGORITHM.md) - Timetable generation algorithm
- [Setup Guide](docs/SETUP.md) - Detailed setup instructions

## 🤝 Contributing

1. Follow the existing code structure
2. Add comments for complex logic
3. Update documentation for new features
4. Test thoroughly before committing

## 📄 License

MIT License

## 👥 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ for efficient academic scheduling**
