const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadEvidence } = require('../controllers/uploadController');

router.post('/', protect, upload.single('evidence'), uploadEvidence);

module.exports = router;
