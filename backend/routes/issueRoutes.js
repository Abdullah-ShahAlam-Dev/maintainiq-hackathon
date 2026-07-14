const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const allowRoles = require('../middleware/role');
const {
  createIssue,
  getIssues,
  getIssueById,
  assignIssue,
  updateIssueStatus,
  reopenIssue
} = require('../controllers/issueController');

// Public reporting — no login required, but if a valid session cookie is
// present (logged-in user), req.user gets attached and the OTP check is skipped.
router.post('/', optionalAuth, createIssue);

// Internal dashboard routes — require login
router.get('/', protect, getIssues);
router.get('/:id', protect, getIssueById);
router.put('/:id/assign', protect, allowRoles('admin'), assignIssue);
router.put('/:id/status', protect, allowRoles('admin', 'technician'), updateIssueStatus);
router.put('/:id/reopen', protect, allowRoles('admin'), reopenIssue);

module.exports = router;
