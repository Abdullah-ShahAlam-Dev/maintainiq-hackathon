const express = require('express');
const router = express.Router();
const { aiTriage } = require('../controllers/aiController');

// No auth required — public reporting page also needs this before an account exists
router.post('/triage', aiTriage);

module.exports = router;
