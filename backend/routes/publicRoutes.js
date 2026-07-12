const express = require('express');
const router = express.Router();
const { getPublicAsset } = require('../controllers/assetController');

// Public — no login required, only safe fields returned
router.get('/asset/:code', getPublicAsset);

module.exports = router;
