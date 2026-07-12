const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const allowRoles = require('../middleware/role');
const { register, login, getTechnicians } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/technicians', protect, allowRoles('admin'), getTechnicians);

module.exports = router;
