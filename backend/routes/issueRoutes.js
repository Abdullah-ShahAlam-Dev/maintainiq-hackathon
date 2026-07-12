const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const allowRoles = require('../middleware/role');
const {
  createIssue,
  getIssues,
  getIssueById,
  assignIssue,
  updateIssueStatus,
  reopenIssue
} = require('../controllers/issueController');

// Public reporting — no login required (person scanning QR reports an issue)
router.post('/', createIssue);

// Internal dashboard routes — require login
router.get('/', protect, getIssues);
router.get('/:id', protect, getIssueById);
router.put('/:id/assign', protect, allowRoles('admin'), assignIssue);
router.put('/:id/status', protect, allowRoles('admin', 'technician'), updateIssueStatus);
router.put('/:id/reopen', protect, allowRoles('admin'), reopenIssue);

module.exports = router;
