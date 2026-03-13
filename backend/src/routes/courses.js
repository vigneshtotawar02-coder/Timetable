const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');

const router = express.Router();

// Validation rules
const courseValidation = [
  body('course_name').notEmpty().withMessage('Course name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('faculty_id').isUUID().withMessage('Valid faculty ID is required'),
  body('weekly_hours').isInt({ min: 1, max: 10 }).withMessage('Weekly hours must be between 1 and 10')
];

// Routes
router.post('/', authenticate, authorize('admin'), courseValidation, validate, createCourse);
router.get('/', authenticate, getCourses);
router.get('/:id', authenticate, getCourse);
router.put('/:id', authenticate, authorize('admin'), updateCourse);
router.delete('/:id', authenticate, authorize('admin'), deleteCourse);

module.exports = router;
