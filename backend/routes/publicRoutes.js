const express = require('express');
const router = express.Router();
const { getPublicAssets, getPublicAsset } = require('../controllers/assetController');
const { sendGuestOtp, verifyGuestOtp } = require('../controllers/publicAuthController');

// Public — no login required, only safe fields returned
router.get('/assets', getPublicAssets);
router.get('/asset/:code', getPublicAsset);

// Guest issue-reporting OTP (no account created)
router.post('/otp/send', sendGuestOtp);
router.post('/otp/verify', verifyGuestOtp);

module.exports = router;
