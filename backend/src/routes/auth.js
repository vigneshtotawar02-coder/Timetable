const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validator');
const {
  register,
  login,
  logout,
  getMe,
  getUsers,
  updateUser,
  deleteUser
} = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['admin', 'faculty', 'student']).withMessage('Invalid role'),
  body('department').notEmpty().withMessage('Department is required')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, getUsers);
router.put('/users/:id', authenticate, updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;
