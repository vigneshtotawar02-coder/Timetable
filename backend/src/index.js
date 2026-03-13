require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const timetableRoutes = require('./routes/timetable');
const roomRoutes = require('./routes/rooms');
const timeSlotRoutes = require('./routes/timeSlots');
const facultyAvailabilityRoutes = require('./routes/facultyAvailability');
const analyticsRoutes = require('./routes/analytics');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Timetable Generation System API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/time-slots', timeSlotRoutes);
app.use('/api/faculty-availability', facultyAvailabilityRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

module.exports = app;
