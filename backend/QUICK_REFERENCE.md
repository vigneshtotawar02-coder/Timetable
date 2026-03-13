# Quick Reference Guide

## 🚀 Getting Started (5 Minutes)

### 1. Install & Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
mkdir logs
```

### 2. Database Setup
- Open Supabase Dashboard → SQL Editor
- Copy content from `database/schema.sql`
- Execute the SQL

### 3. Start Server
```bash
npm run dev
```
Server runs on: https://timetable-vmbl.onrender.com

### 4. Test Health Check
```bash
curl https://timetable-vmbl.onrender.com/health
```

---

## 📍 Quick API Reference

### Base URL
```
https://timetable-vmbl.onrender.com/api
```

### Authentication Header
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔑 Common API Calls

### 1. Register Admin
```bash
curl -X POST https://timetable-vmbl.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "admin",
    "department": "Computer Science"
  }'
```

### 2. Login
```bash
curl -X POST https://timetable-vmbl.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```
**Save the `access_token` from response!**

### 3. Create Room
```bash
curl -X POST https://timetable-vmbl.onrender.com/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "room_name": "Room 101",
    "capacity": 30
  }'
```

### 4. Create Course
```bash
curl -X POST https://timetable-vmbl.onrender.com/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "course_name": "Data Structures",
    "department": "Computer Science",
    "semester": 3,
    "faculty_id": "FACULTY_UUID_HERE",
    "weekly_hours": 4
  }'
```

### 5. Generate Timetable 🎯
```bash
curl -X POST https://timetable-vmbl.onrender.com/api/timetable/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "department": "Computer Science",
    "semester": 3
  }'
```

### 6. Get Timetable
```bash
curl https://timetable-vmbl.onrender.com/api/timetable/Computer%20Science/3 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Get Analytics
```bash
# Faculty Workload
curl https://timetable-vmbl.onrender.com/api/analytics/faculty-workload \
  -H "Authorization: Bearer YOUR_TOKEN"

# Room Utilization
curl https://timetable-vmbl.onrender.com/api/analytics/room-utilization \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/           # Database & logger
│   ├── controllers/      # Request handlers (8 files)
│   ├── middleware/       # Auth, validation, errors
│   ├── routes/           # API endpoints (7 files)
│   ├── services/         # AI algorithm ⭐
│   ├── utils/            # Helper functions
│   └── index.js          # Entry point
├── database/
│   └── schema.sql        # PostgreSQL schema
├── docs/                 # Documentation (7 files)
└── logs/                 # Log files
```

---

## 🎯 Main Features

### Core Endpoints
- **Auth**: Register, Login, Logout (4 endpoints)
- **Courses**: CRUD operations (5 endpoints)
- **Timetable**: Generate, View, Delete (4 endpoints)
- **Rooms**: CRUD operations (4 endpoints)
- **Time Slots**: CRUD operations (4 endpoints)
- **Faculty Availability**: Manage availability (5 endpoints)
- **Analytics**: Workload, Utilization, Overview (3 endpoints)

**Total: 29 Endpoints**

---

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access - manage everything, generate timetables |
| **Faculty** | View timetables, manage own availability |
| **Student** | View timetables only |

---

## 🗄️ Database Tables

1. **users** - All system users
2. **courses** - Course information
3. **rooms** - Classroom data
4. **time_slots** - Scheduling periods
5. **faculty_availability** - Faculty availability
6. **timetable** - Generated schedules

---

## 🤖 AI Algorithm

**Type**: Constraint Satisfaction Problem (CSP)
**Methods**: Greedy + Backtracking + Heuristics

**Constraints**:
- ✅ No faculty overlap
- ✅ No room overlap  
- ✅ Faculty availability
- ✅ Weekly hours met
- ✅ No consecutive classes
- ✅ Distributed schedule

**Performance**:
- 10 courses: < 100ms
- 50 courses: 1-2 seconds
- 200 courses: 5-10 seconds

---

## 🛠️ Environment Variables

Required in `.env`:
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | Quick start guide |
| **API.md** | Complete API reference |
| **ARCHITECTURE.md** | System architecture |
| **ALGORITHM.md** | AI algorithm details |
| **SETUP.md** | Setup instructions |
| **PROJECT_OVERVIEW.md** | Complete overview |
| **DIAGRAMS.md** | Visual diagrams |
| **IMPLEMENTATION_SUMMARY.md** | Build summary |

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=5001
```

### Database Connection Failed
- Check Supabase credentials
- Verify internet connection
- Ensure project is running

### Authentication Failed
- Verify token is correct
- Check token hasn't expired
- Ensure user exists

### Logs
```bash
# View error logs
tail -f logs/error.log

# View all logs
tail -f logs/combined.log
```

---

## ⚡ Common Tasks

### Add New Endpoint
1. Create route in `src/routes/`
2. Add controller in `src/controllers/`
3. Add validation rules
4. Test endpoint

### Add New Table
1. Add SQL in `database/schema.sql`
2. Run in Supabase SQL Editor
3. Create controller/routes
4. Update documentation

### Deploy to Production
1. Set production environment variables
2. Use production Supabase instance
3. Use PM2 or Docker
4. Configure reverse proxy (Nginx)
5. Enable HTTPS

---

## 📞 Help & Support

**Documentation**: Check `docs/` folder
**Issues**: Review error logs
**Code**: All files have inline comments

---

## ✅ Pre-Flight Checklist

Before using the system:
- [ ] Node.js installed (v16+)
- [ ] npm dependencies installed
- [ ] .env file configured
- [ ] Supabase project created
- [ ] Database schema executed
- [ ] Server starts successfully
- [ ] Health check returns 200

---

## 🎯 Typical Workflow

1. **Admin Setup**
   - Register as admin
   - Create rooms
   - Configure time slots

2. **Faculty Setup**
   - Register faculty users
   - Set availability

3. **Course Setup**
   - Create courses
   - Assign faculty

4. **Generate Schedule**
   - Select department & semester
   - Generate timetable
   - Review results

5. **View & Analyze**
   - View timetables
   - Check analytics
   - Monitor utilization

---

## 🚀 Performance Tips

- Use indexes on frequently queried columns
- Enable connection pooling
- Implement caching for static data
- Use pagination for large datasets
- Monitor query performance

---

**For detailed information, see full documentation in the `docs/` folder.**

---

*Quick Reference Guide v1.0*
