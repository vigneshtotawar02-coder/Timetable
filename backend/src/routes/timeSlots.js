const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createTimeSlot,
  getTimeSlots,
  updateTimeSlot,
  deleteTimeSlot
} = require('../controllers/timeSlotController');

const router = express.Router();

// Validation rules
const timeSlotValidation = [
  body('day').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
];

// Routes
router.post('/', authenticate, authorize('admin'), timeSlotValidation, validate, createTimeSlot);
router.get('/', authenticate, getTimeSlots);
router.put('/:id', authenticate, authorize('admin'), updateTimeSlot);
router.delete('/:id', authenticate, authorize('admin'), deleteTimeSlot);

module.exports = router;
