const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createFacultyAvailability,
  createBulkFacultyAvailability,
  getFacultyAvailability,
  updateFacultyAvailability,
  deleteFacultyAvailability
} = require('../controllers/facultyAvailabilityController');

const router = express.Router();

// Validation rules
const availabilityValidation = [
  body('faculty_id').isUUID().withMessage('Valid faculty ID is required'),
  body('day').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day'),
  body('time_slot').isInt().withMessage('Time slot must be a valid ID'),
  body('available').isBoolean().withMessage('Available must be a boolean')
];

const bulkAvailabilityValidation = [
  body('faculty_id').isUUID().withMessage('Valid faculty ID is required'),
  body('availabilities').isArray({ min: 1 }).withMessage('Availabilities must be a non-empty array')
];

// Routes
router.post('/', authenticate, authorize('admin', 'faculty'), availabilityValidation, validate, createFacultyAvailability);
router.post('/bulk', authenticate, authorize('admin', 'faculty'), bulkAvailabilityValidation, validate, createBulkFacultyAvailability);
router.get('/:faculty_id', authenticate, getFacultyAvailability);
router.put('/:id', authenticate, authorize('admin', 'faculty'), updateFacultyAvailability);
router.delete('/:id', authenticate, authorize('admin', 'faculty'), deleteFacultyAvailability);

module.exports = router;
