const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const allowRoles = require('../middleware/role');
const { createMaintenanceRecord, getRecordsByIssue } = require('../controllers/maintenanceController');

router.post('/', protect, allowRoles('admin', 'technician'), createMaintenanceRecord);
router.get('/issue/:issueId', protect, getRecordsByIssue);

module.exports = router;
