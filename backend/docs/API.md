# API Documentation

Complete API reference for the AI-Based Timetable Generation System.

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]  // Optional validation errors
}
```

---

## Authentication Endpoints

### 1. Register User

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "faculty",
  "department": "Computer Science"
}
```

**Validation Rules:**
- `email`: Valid email format
- `password`: Minimum 6 characters
- `name`: Required, not empty
- `role`: Must be one of: `admin`, `faculty`, `student`
- `department`: Required, not empty

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "faculty",
      "department": "Computer Science"
    }
  }
}
```

### 2. Login

**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "faculty",
      "department": "Computer Science"
    },
    "session": {
      "access_token": "jwt_token_here",
      "refresh_token": "refresh_token_here",
      "expires_at": 1234567890
    }
  }
}
```

### 3. Logout

**POST** `/auth/logout`

Logout current user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 4. Get Current User

**GET** `/auth/me`

Get currently authenticated user details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "faculty",
      "department": "Computer Science"
    }
  }
}
```

---

## Course Endpoints

### 1. Create Course

**POST** `/courses`

**Access:** Admin only

**Request Body:**
```json
{
  "course_name": "Data Structures",
  "department": "Computer Science",
  "semester": 3,
  "faculty_id": "uuid",
  "weekly_hours": 4
}
```

**Validation Rules:**
- `course_name`: Required
- `department`: Required
- `semester`: Integer between 1-8
- `faculty_id`: Valid UUID
- `weekly_hours`: Integer between 1-10

**Response:** `201 Created`

### 2. Get All Courses

**GET** `/courses`

**Query Parameters:**
- `department` (optional): Filter by department
- `semester` (optional): Filter by semester
- `faculty_id` (optional): Filter by faculty

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 5,
  "data": {
    "courses": [
      {
        "id": 1,
        "course_name": "Data Structures",
        "department": "Computer Science",
        "semester": 3,
        "faculty_id": "uuid",
        "weekly_hours": 4,
        "faculty": {
          "id": "uuid",
          "name": "Dr. Smith",
          "email": "smith@example.com"
        }
      }
    ]
  }
}
```

### 3. Get Single Course

**GET** `/courses/:id`

**Response:** `200 OK`

### 4. Update Course

**PUT** `/courses/:id`

**Access:** Admin only

**Request Body:** Same as Create Course (all fields optional)

**Response:** `200 OK`

### 5. Delete Course

**DELETE** `/courses/:id`

**Access:** Admin only

**Response:** `200 OK`

---

## Timetable Endpoints

### 1. Generate Timetable

**POST** `/timetable/generate`

**Access:** Admin only

Generate timetable using AI algorithm.

**Request Body:**
```json
{
  "department": "Computer Science",
  "semester": 3
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Timetable generated successfully",
  "data": {
    "timetable": [
      {
        "id": 1,
        "course_id": 1,
        "faculty_id": "uuid",
        "room_id": 1,
        "day": "Monday",
        "time_slot": 1,
        "semester": 3,
        "department": "Computer Science"
      }
    ],
    "stats": {
      "total_classes": 15,
      "courses_scheduled": 5
    }
  }
}
```

### 2. Get Timetable

**GET** `/timetable/:department/:semester`

Get timetable for a specific department and semester.

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 15,
  "data": {
    "timetable": [
      {
        "id": 1,
        "day": "Monday",
        "time_slot": 1,
        "course": {
          "id": 1,
          "course_name": "Data Structures",
          "weekly_hours": 4
        },
        "faculty": {
          "id": "uuid",
          "name": "Dr. Smith",
          "email": "smith@example.com"
        },
        "room": {
          "id": 1,
          "room_name": "Room 101",
          "capacity": 30
        },
        "time_slot_details": {
          "id": 1,
          "day": "Monday",
          "start_time": "08:00",
          "end_time": "09:00"
        }
      }
    ]
  }
}
```

### 3. Get Faculty Timetable

**GET** `/timetable/faculty/:id`

**Query Parameters:**
- `semester` (optional): Filter by semester

**Response:** `200 OK`

### 4. Delete Timetable

**DELETE** `/timetable/:department/:semester`

**Access:** Admin only

**Response:** `200 OK`

---

## Room Endpoints

### 1. Create Room

**POST** `/rooms`

**Access:** Admin only

**Request Body:**
```json
{
  "room_name": "Room 101",
  "capacity": 30
}
```

**Response:** `201 Created`

### 2. Get All Rooms

**GET** `/rooms`

**Response:** `200 OK`

### 3. Update Room

**PUT** `/rooms/:id`

**Access:** Admin only

**Response:** `200 OK`

### 4. Delete Room

**DELETE** `/rooms/:id`

**Access:** Admin only

**Response:** `200 OK`

---

## Time Slot Endpoints

### 1. Create Time Slot

**POST** `/time-slots`

**Access:** Admin only

**Request Body:**
```json
{
  "day": "Monday",
  "start_time": "08:00",
  "end_time": "09:00"
}
```

**Validation Rules:**
- `day`: Must be valid day name
- `start_time`: HH:MM format
- `end_time`: HH:MM format, must be after start_time

**Response:** `201 Created`

### 2. Get All Time Slots

**GET** `/time-slots`

**Query Parameters:**
- `day` (optional): Filter by day

**Response:** `200 OK`

### 3. Update Time Slot

**PUT** `/time-slots/:id`

**Access:** Admin only

**Response:** `200 OK`

### 4. Delete Time Slot

**DELETE** `/time-slots/:id`

**Access:** Admin only

**Response:** `200 OK`

---

## Faculty Availability Endpoints

### 1. Create Faculty Availability

**POST** `/faculty-availability`

**Access:** Admin or owning Faculty

**Request Body:**
```json
{
  "faculty_id": "uuid",
  "day": "Monday",
  "time_slot": 1,
  "available": true
}
```

**Response:** `201 Created`

### 2. Bulk Create Faculty Availability

**POST** `/faculty-availability/bulk`

**Access:** Admin or owning Faculty

**Request Body:**
```json
{
  "faculty_id": "uuid",
  "availabilities": [
    {
      "day": "Monday",
      "time_slot": 1,
      "available": true
    },
    {
      "day": "Monday",
      "time_slot": 2,
      "available": false
    }
  ]
}
```

**Response:** `201 Created`

### 3. Get Faculty Availability

**GET** `/faculty-availability/:faculty_id`

**Query Parameters:**
- `day` (optional): Filter by day
- `available` (optional): Filter by availability (true/false)

**Response:** `200 OK`

### 4. Update Faculty Availability

**PUT** `/faculty-availability/:id`

**Access:** Admin or owning Faculty

**Response:** `200 OK`

### 5. Delete Faculty Availability

**DELETE** `/faculty-availability/:id`

**Access:** Admin or owning Faculty

**Response:** `200 OK`

---

## Analytics Endpoints

### 1. Faculty Workload

**GET** `/analytics/faculty-workload`

**Access:** Admin only

**Query Parameters:**
- `department` (optional): Filter by department
- `semester` (optional): Filter by semester

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "workload": [
      {
        "faculty_id": "uuid",
        "faculty_name": "Dr. Smith",
        "faculty_email": "smith@example.com",
        "department": "Computer Science",
        "total_classes": 12,
        "total_hours": 15,
        "courses": [
          {
            "id": 1,
            "name": "Data Structures",
            "weekly_hours": 4
          }
        ]
      }
    ],
    "statistics": {
      "total_faculty": 10,
      "average_classes": "10.50",
      "average_hours": "12.30",
      "max_workload": 15,
      "min_workload": 8
    }
  }
}
```

### 2. Room Utilization

**GET** `/analytics/room-utilization`

**Access:** Admin only

**Query Parameters:**
- `department` (optional): Filter by department
- `semester` (optional): Filter by semester

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "utilization": [
      {
        "room_id": 1,
        "room_name": "Room 101",
        "capacity": 30,
        "total_slots": 45,
        "used_slots": 30,
        "utilization_percentage": "66.67"
      }
    ],
    "statistics": {
      "total_rooms": 8,
      "average_utilization": "55.50",
      "fully_utilized_rooms": 2,
      "underutilized_rooms": 3
    }
  }
}
```

### 3. Department Overview

**GET** `/analytics/department-overview`

**Access:** Admin only

**Query Parameters:**
- `department` (optional): Filter by specific department

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 5,
  "data": {
    "overview": [
      {
        "department": "Computer Science",
        "total_courses": 15,
        "total_faculty": 10,
        "total_students": 200,
        "total_classes_scheduled": 45
      }
    ]
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (Validation Error) |
| 401 | Unauthorized (Invalid/Missing Token) |
| 403 | Forbidden (Insufficient Permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding rate limiting in production.

## Postman Collection

Import this base collection for testing:

```json
{
  "info": {
    "name": "Timetable API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```
