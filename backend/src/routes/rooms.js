const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createRoom,
  getRooms,
  updateRoom,
  deleteRoom
} = require('../controllers/roomController');

const router = express.Router();

// Validation rules
const roomValidation = [
  body('room_name').notEmpty().withMessage('Room name is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
];

// Routes
router.post('/', authenticate, authorize('admin'), roomValidation, validate, createRoom);
router.get('/', authenticate, getRooms);
router.put('/:id', authenticate, authorize('admin'), updateRoom);
router.delete('/:id', authenticate, authorize('admin'), deleteRoom);

module.exports = router;
