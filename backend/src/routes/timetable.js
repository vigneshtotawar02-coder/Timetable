const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  generateTimetable,
  getTimetable,
  getFacultyTimetable,
  deleteTimetable
} = require('../controllers/timetableController');

const router = express.Router();

// Validation rules
const generateValidation = [
  body('department').notEmpty().withMessage('Department is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8')
];

// Routes
router.post('/generate', authenticate, authorize('admin'), generateValidation, validate, generateTimetable);
router.get('/:department/:semester', authenticate, getTimetable);
router.get('/faculty/:id', authenticate, getFacultyTimetable);
router.delete('/:department/:semester', authenticate, authorize('admin'), deleteTimetable);

// Debug endpoint - test raw query
router.get('/debug/faculty/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { supabase } = require('../config/supabase');
  
  console.log('=== DEBUG ENDPOINT ===');
  console.log('Faculty ID:', id);
  
  // Test 1: Raw query without any filters
  const { data: allData, error: allError } = await supabase
    .from('timetable')
    .select('*');
  
  console.log('Total timetable entries in DB:', allData?.length);
  
  // Test 2: Query with faculty_id filter
  const { data: facultyData, error: facultyError } = await supabase
    .from('timetable')
    .select('*')
    .eq('faculty_id', id);
  
  console.log('Entries for this faculty:', facultyData?.length);
  console.log('Faculty data:', facultyData);
  console.log('Error:', facultyError);
  
  res.json({
    totalEntries: allData?.length || 0,
    facultyEntries: facultyData?.length || 0,
    facultyData: facultyData,
    error: facultyError
  });
});

module.exports = router;
