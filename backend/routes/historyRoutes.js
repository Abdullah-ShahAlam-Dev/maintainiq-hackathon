const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getHistoryByAsset } = require('../controllers/historyController');

router.get('/:assetId', protect, getHistoryByAsset);

module.exports = router;
