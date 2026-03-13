# System Architecture

## Overview

The AI-Based Timetable Generation System follows a modular, layered architecture pattern that ensures scalability, maintainability, and separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│     (Frontend - React/Angular/Mobile/Web Applications)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                        │
│                     (Express.js Server)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware: CORS, Auth, Validation, Error Handling    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      ROUTING LAYER                           │
│  ┌───────┬────────┬──────────┬───────┬──────────┬─────────┐│
│  │ Auth  │Courses │Timetable │ Rooms │TimeSlots │Analytics││
│  │Routes │ Routes │  Routes  │Routes │  Routes  │ Routes  ││
│  └───────┴────────┴──────────┴───────┴──────────┴─────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONTROLLER LAYER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Request Handling, Input Validation, Response Format  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Business Logic & Algorithms                  │  │
│  │   • TimetableService (AI Generation)                  │  │
│  │   • Constraint Satisfaction                           │  │
│  │   • Backtracking Algorithm                            │  │
│  │   • Greedy Heuristics                                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA ACCESS LAYER                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Supabase Client (PostgreSQL ORM)              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                           │
│             Supabase (PostgreSQL Database)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tables: users, courses, rooms, time_slots,          │   │
│  │  faculty_availability, timetable                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION SERVICE                      │
│                    (Supabase Auth + JWT)                     │
└─────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. Client Layer
- **Purpose**: User interface and interaction
- **Technologies**: Can be any frontend (React, Angular, Vue, Mobile apps)
- **Communication**: REST API calls to backend

### 2. API Gateway Layer
- **Purpose**: Request handling, middleware execution
- **Components**:
  - Express.js server
  - CORS middleware
  - Authentication middleware
  - Input validation
  - Error handling
  - Logging
- **Responsibilities**:
  - Route incoming requests
  - Apply middleware chain
  - Handle cross-origin requests
  - Log all activities

### 3. Routing Layer
- **Purpose**: Map HTTP endpoints to controllers
- **Structure**:
  - Modular route files for each resource
  - RESTful endpoint design
  - Version control ready
- **Routes**:
  - `/api/auth` - Authentication endpoints
  - `/api/courses` - Course management
  - `/api/timetable` - Timetable operations
  - `/api/rooms` - Room management
  - `/api/time-slots` - Time slot management
  - `/api/faculty-availability` - Faculty availability
  - `/api/analytics` - Analytics and reporting

### 4. Controller Layer
- **Purpose**: Handle business logic orchestration
- **Responsibilities**:
  - Parse and validate request data
  - Call appropriate services
  - Format response data
  - Handle errors gracefully
  - Apply authorization rules
- **Pattern**: Thin controllers, fat services

### 5. Service Layer
- **Purpose**: Core business logic and algorithms
- **Components**:
  - **TimetableService**: AI-based timetable generation
  - Constraint satisfaction solver
  - Backtracking algorithm implementation
  - Greedy heuristic optimization
- **Characteristics**:
  - Pure business logic
  - No HTTP concerns
  - Testable and reusable
  - Algorithm implementations

### 6. Data Access Layer
- **Purpose**: Database interaction abstraction
- **Components**:
  - Supabase client initialization
  - Query builders
  - Transaction management
- **Benefits**:
  - Clean separation from business logic
  - Easy to mock for testing
  - Database agnostic (can switch DBs)

### 7. Database Layer
- **Technology**: PostgreSQL via Supabase
- **Features**:
  - Relational data model
  - ACID compliance
  - Row Level Security (RLS)
  - Foreign key constraints
  - Indexed queries
  - Triggers for automation

### 8. Authentication Service
- **Technology**: Supabase Auth + JWT
- **Features**:
  - User registration/login
  - Password hashing (bcrypt)
  - JWT token generation
  - Token verification
  - Role-based access control

## Component Interaction Flow

### Request Flow Example: Generate Timetable

```
1. Client sends POST request to /api/timetable/generate
   ↓
2. Express server receives request
   ↓
3. CORS middleware validates origin
   ↓
4. Authentication middleware verifies JWT token
   ↓
5. Authorization middleware checks user role (admin)
   ↓
6. Validation middleware validates request body
   ↓
7. Router directs to timetableController.generateTimetable
   ↓
8. Controller fetches data (courses, rooms, time slots)
   ↓
9. Controller instantiates TimetableService
   ↓
10. TimetableService runs AI algorithm:
    a. Calculate requirements
    b. Apply greedy selection
    c. Validate constraints
    d. Backtrack if needed
    e. Return generated timetable
   ↓
11. Controller saves timetable to database
   ↓
12. Controller formats response
   ↓
13. Response sent back to client
```

## Design Patterns

### 1. MVC Pattern
- **Model**: Database schema and Supabase client
- **View**: API responses (JSON)
- **Controller**: Request handlers

### 2. Repository Pattern
- Data access abstracted through Supabase client
- Clean separation between data and business logic

### 3. Middleware Pattern
- Chain of responsibility for request processing
- Reusable middleware components

### 4. Service Pattern
- Complex business logic encapsulated in services
- Reusable across different controllers

### 5. Factory Pattern
- Dynamic creation of timetable entries
- Flexible object instantiation

## Security Architecture

### Authentication Flow
```
1. User logs in with credentials
   ↓
2. Supabase Auth validates credentials
   ↓
3. JWT token generated and returned
   ↓
4. Client stores token (localStorage/cookies)
   ↓
5. Client includes token in Authorization header
   ↓
6. Server validates token on each request
   ↓
7. User identity and role attached to request
```

### Authorization Layers
- **Middleware Level**: Role-based route protection
- **Controller Level**: Resource ownership checks
- **Database Level**: Row Level Security policies

### Security Features
- JWT token expiration
- Password hashing (handled by Supabase)
- Input validation and sanitization
- SQL injection prevention
- Error message sanitization
- Rate limiting ready

## Scalability Considerations

### Horizontal Scalability
- Stateless server design
- JWT tokens (no session storage)
- Can deploy multiple instances
- Load balancer ready

### Vertical Scalability
- Efficient algorithms (O(n log n) complexity)
- Database indexing
- Query optimization
- Caching ready

### Database Scalability
- Indexed columns for fast queries
- Efficient joins using foreign keys
- Connection pooling (Supabase)
- Read replicas support

## Performance Optimization

### API Performance
- Async/await for non-blocking operations
- Efficient database queries
- Minimal data transfer
- Response compression ready

### Algorithm Performance
- Optimized constraint checking
- Early termination on conflicts
- Heuristic-guided search
- Memory-efficient data structures

### Database Performance
- Proper indexing strategy
- Foreign key relationships
- Query result caching
- Connection pooling

## Monitoring & Logging

### Logging Strategy
- **Winston Logger**: Structured logging
- **Log Levels**: error, warn, info, debug
- **Log Storage**: File system (error.log, combined.log)
- **Log Rotation**: Ready for log rotation

### Monitoring Points
- API request/response times
- Error rates
- Database query performance
- Timetable generation success rate
- User authentication attempts

## Error Handling Strategy

### Error Types
1. **Validation Errors** (400): Invalid input
2. **Authentication Errors** (401): Invalid/missing token
3. **Authorization Errors** (403): Insufficient permissions
4. **Not Found Errors** (404): Resource not found
5. **Server Errors** (500): Internal errors

### Error Flow
```
Error occurs
   ↓
Caught by asyncHandler or try-catch
   ↓
Passed to error handling middleware
   ↓
Logged with Winston
   ↓
Formatted error response
   ↓
Sent to client
```

## Deployment Architecture

### Development Environment
```
Local Machine
├── Node.js Server (localhost:5000)
├── Supabase Cloud Database
└── Environment Variables (.env)
```

### Production Environment (Recommended)
```
Cloud Platform (AWS/GCP/Azure/Vercel)
├── Load Balancer
├── Multiple Server Instances
│   ├── Instance 1 (Node.js)
│   ├── Instance 2 (Node.js)
│   └── Instance N (Node.js)
├── Supabase Production Database
├── Environment Variables (Secrets Manager)
└── CDN (for static assets)
```

## Technology Choices Rationale

### Why Node.js?
- Excellent for I/O-bound operations
- Large ecosystem (npm)
- JavaScript across stack
- Async/await support
- Fast development

### Why Express.js?
- Lightweight and flexible
- Massive community support
- Middleware ecosystem
- RESTful API friendly
- Easy to learn and use

### Why Supabase?
- PostgreSQL (robust RDBMS)
- Built-in authentication
- Row Level Security
- Real-time capabilities
- Auto-generated APIs
- Easy to use

### Why JWT?
- Stateless authentication
- Scalable across instances
- Standard protocol
- Compact and secure
- Easy to implement

## Future Enhancements

### Possible Additions
1. **Caching Layer**: Redis for frequently accessed data
2. **Queue System**: Bull/BullMQ for async timetable generation
3. **WebSockets**: Real-time timetable updates
4. **Microservices**: Split into smaller services
5. **API Versioning**: Support multiple API versions
6. **GraphQL**: Alternative to REST
7. **Container**: Docker for consistent deployment
8. **CI/CD**: Automated testing and deployment

### Algorithm Improvements
1. **Genetic Algorithm**: For better optimization
2. **Machine Learning**: Learn from past timetables
3. **Multi-objective Optimization**: Balance multiple goals
4. **Parallel Processing**: Faster generation
5. **Constraint Relaxation**: Handle impossible scenarios

## Conclusion

The architecture is designed to be:
- **Modular**: Easy to modify and extend
- **Scalable**: Handles growth efficiently
- **Maintainable**: Clean code and structure
- **Secure**: Multiple security layers
- **Performant**: Optimized for speed
- **Testable**: Each layer can be tested independently
