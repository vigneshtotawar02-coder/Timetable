const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getFacultyWorkload,
  getRoomUtilization,
  getDepartmentOverview
} = require('../controllers/analyticsController');

const router = express.Router();

// All analytics routes require admin access
router.get('/faculty-workload', authenticate, authorize('admin'), getFacultyWorkload);
router.get('/room-utilization', authenticate, authorize('admin'), getRoomUtilization);
router.get('/department-overview', authenticate, authorize('admin'), getDepartmentOverview);

module.exports = router;
