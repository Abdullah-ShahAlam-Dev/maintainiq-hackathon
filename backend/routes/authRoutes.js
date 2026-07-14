const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const allowRoles = require('../middleware/role');
const upload = require('../middleware/upload');
const {
  register,
  verifySignupOtp,
  resendSignupOtp,
  login,
  logout,
  getMe,
  getPendingUsers,
  getManagementList,
  updateUserStatus,
  deleteUser,
  getTechnicians
} = require('../controllers/authController');

// Public — signup (with optional certification/evidence upload for technicians)
router.post('/register', upload.single('evidence'), register);
router.post('/verify-otp', verifySignupOtp);
router.post('/resend-otp', resendSignupOtp);
router.post('/login', login);
router.post('/logout', logout);

// Logged-in
router.get('/me', protect, getMe);
router.get('/technicians', protect, getTechnicians); // approved technicians, for assignment dropdown

// Approvals tab — admin sees technicians only, superadmin sees both
router.get('/pending', protect, allowRoles('admin', 'superadmin'), getPendingUsers);

// Management tabs (Administrators / Technicians / Users lists)
router.get('/list', protect, allowRoles('admin', 'superadmin'), getManagementList);
router.put('/:id/status', protect, allowRoles('admin', 'superadmin'), updateUserStatus);
router.delete('/:id', protect, allowRoles('admin', 'superadmin'), deleteUser);

module.exports = router;
