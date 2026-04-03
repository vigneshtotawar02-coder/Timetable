const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { createBatch, getBatches, updateBatch, deleteBatch, getBatchAssignments } = require('../controllers/batchController');

const router = express.Router();

router.post('/', authenticate, authorize('admin'), createBatch);
router.get('/', authenticate, getBatches);
router.put('/:id', authenticate, authorize('admin'), updateBatch);
router.delete('/:id', authenticate, authorize('admin'), deleteBatch);
router.get('/:id/assignments', authenticate, getBatchAssignments);

module.exports = router;
