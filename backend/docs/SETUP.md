# Setup Guide

Complete step-by-step guide to set up the AI-Based Timetable Generation System backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Application Setup](#application-setup)
5. [Testing the API](#testing-the-api)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)

## Prerequisites

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| Node.js | v16+ | https://nodejs.org/ |
| npm | v7+ | Comes with Node.js |
| Git | Latest | https://git-scm.com/ |

### Required Accounts

1. **Supabase Account** (Free tier available)
   - Sign up at: https://supabase.com
   - Create a new project

### System Requirements

- **OS**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB
- **Disk**: 500MB free space
- **Internet**: Required for Supabase connection

## Environment Setup

### Step 1: Clone/Navigate to Project

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- express (^4.18.2)
- @supabase/supabase-js (^2.39.3)
- cors (^2.8.5)
- dotenv (^16.4.1)
- express-validator (^7.0.1)
- jsonwebtoken (^9.0.2)
- winston (^3.11.0)

**Development dependencies:**
- nodemon (^3.0.3)
- jest (^29.7.0)

### Step 3: Create Environment File

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=your_random_secret_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Step 4: Generate JWT Secret

Generate a secure random string for JWT_SECRET:

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Using OpenSSL:**
```bash
openssl rand -hex 64
```

Copy the output to your `.env` file.

## Database Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details:
   - Name: `timetable-system`
   - Database Password: (save this securely)
   - Region: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### Step 2: Get Supabase Credentials

Once your project is ready:

1. Go to Project Settings (⚙️ icon)
2. Navigate to "API" section
3. Copy these values to your `.env`:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Run Database Schema

1. In Supabase Dashboard, go to "SQL Editor"
2. Click "New Query"
3. Open `backend/database/schema.sql`
4. Copy the entire content
5. Paste into SQL Editor
6. Click "Run" or press Ctrl+Enter

This will create:
- All required tables
- Indexes for performance
- Sample time slots (Monday-Friday, 8 AM - 5 PM)
- Sample rooms
- Row Level Security policies
- Triggers for updated_at columns

### Step 4: Verify Database Setup

Run this query in SQL Editor to verify:

```sql
SELECT 
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
    AND table_name IN (
        'users', 
        'courses', 
        'rooms', 
        'time_slots', 
        'faculty_availability', 
        'timetable'
    );
```

You should see all 6 tables listed.

### Step 5: Configure Supabase Auth

1. Go to "Authentication" → "Providers"
2. Ensure "Email" provider is enabled
3. Go to "Authentication" → "Settings"
4. Set these options:
   - Enable email confirmations: **OFF** (for development)
   - Enable phone confirmations: **OFF**
5. Save changes

## Application Setup

### Step 1: Create Logs Directory

```bash
mkdir -p logs
```

This directory will store:
- `error.log` - Error level logs
- `combined.log` - All logs

### Step 2: Verify Environment Variables

Check that all required environment variables are set:

```bash
node -e "require('dotenv').config(); console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗'); console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓' : '✗'); console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓' : '✗');"
```

All should show ✓

### Step 3: Start Development Server

```bash
npm run dev
```

You should see:
```
Server running in development mode on port 5000
Health check available at http://localhost:5000/health
```

### Step 4: Test Health Endpoint

Open browser or use curl:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "AI Timetable Generation System API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing the API

### Option 1: Using cURL

#### 1. Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "admin",
    "department": "Computer Science"
  }'
```

#### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

Save the `access_token` from response.

#### 3. Create a Course

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "course_name": "Data Structures",
    "department": "Computer Science",
    "semester": 3,
    "faculty_id": "YOUR_FACULTY_UUID",
    "weekly_hours": 4
  }'
```

### Option 2: Using Postman

1. **Import Collection**
   - Create new collection: "Timetable API"
   - Set variable: `baseUrl` = `http://localhost:5000/api`
   - Set variable: `token` = (empty, will be filled after login)

2. **Create Requests**

   **Register:**
   - Method: POST
   - URL: `{{baseUrl}}/auth/register`
   - Body: JSON (see cURL example)

   **Login:**
   - Method: POST
   - URL: `{{baseUrl}}/auth/login`
   - Body: JSON (see cURL example)
   - Tests: Save token from response

   **Get Courses:**
   - Method: GET
   - URL: `{{baseUrl}}/courses`
   - Headers: `Authorization: Bearer {{token}}`

3. **Test Flow**
   - Register user
   - Login (token saved automatically)
   - Test protected endpoints

### Option 3: Using VS Code REST Client

Install "REST Client" extension, then create `test.http`:

```http
### Variables
@baseUrl = http://localhost:5000/api
@token = YOUR_TOKEN_HERE

### Health Check
GET http://localhost:5000/health

### Register
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123",
  "name": "Admin User",
  "role": "admin",
  "department": "Computer Science"
}

### Login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123"
}

### Get Courses
GET {{baseUrl}}/courses
Authorization: Bearer {{token}}
```

## Troubleshooting

### Common Issues

#### Issue 1: "Cannot find module 'dotenv'"

**Solution:**
```bash
npm install
```

#### Issue 2: "EADDRINUSE: Port 5000 already in use"

**Solution:**
Change port in `.env`:
```env
PORT=5001
```

Or kill the process using port 5000:
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

#### Issue 3: "Missing required environment variable: SUPABASE_URL"

**Solution:**
Verify `.env` file exists and contains all required variables.

#### Issue 4: "Invalid API key"

**Solution:**
- Double-check Supabase credentials in `.env`
- Ensure no extra spaces or quotes
- Regenerate keys if necessary

#### Issue 5: Database connection fails

**Solution:**
- Check Supabase project is running
- Verify internet connection
- Check firewall settings
- Ensure correct SUPABASE_URL format

#### Issue 6: Authentication fails

**Solution:**
- Ensure Supabase Auth is configured
- Check email provider is enabled
- Verify user exists in Supabase Dashboard

### Debug Mode

Enable detailed logging:

```env
NODE_ENV=development
```

Check logs:
```bash
tail -f logs/combined.log
```

## Production Deployment

### Step 1: Environment Configuration

Create production `.env`:

```env
PORT=5000
NODE_ENV=production

SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key

JWT_SECRET=your_secure_production_secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://your-frontend-domain.com
```

### Step 2: Install Production Dependencies

```bash
npm install --production
```

### Step 3: Start Production Server

```bash
npm start
```

### Step 4: Use Process Manager

#### Option 1: PM2

```bash
npm install -g pm2

# Start
pm2 start src/index.js --name "timetable-api"

# Monitor
pm2 status
pm2 logs timetable-api

# Auto-restart on system reboot
pm2 startup
pm2 save
```

#### Option 2: Docker

Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t timetable-api .
docker run -p 5000:5000 --env-file .env timetable-api
```

### Step 5: Setup Reverse Proxy

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 6: Enable HTTPS

Use Let's Encrypt:
```bash
sudo certbot --nginx -d api.yourdomain.com
```

### Step 7: Monitor and Maintain

- Set up logging aggregation
- Configure monitoring (e.g., PM2, New Relic)
- Regular database backups
- Update dependencies regularly

## Next Steps

1. **Customize**: Modify business logic for your needs
2. **Integrate**: Connect frontend application
3. **Extend**: Add new features and endpoints
4. **Scale**: Implement caching, load balancing
5. **Monitor**: Set up application monitoring

## Support

For issues:
1. Check logs in `logs/` directory
2. Review documentation in `docs/`
3. Create issue in repository

---

**Congratulations! Your backend is now fully set up and running! 🎉**
