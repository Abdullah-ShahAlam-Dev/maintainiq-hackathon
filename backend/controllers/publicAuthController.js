const jwt = require('jsonwebtoken');
const GuestOtp = require('../models/GuestOtp');
const generateOtp = require('../utils/generateOtp');
const { sendOtpEmail } = require('../utils/sendEmail');

const GUEST_OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes, per spec

// POST /api/public/otp/send  { email }
const sendGuestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const cleanEmail = email.toLowerCase().trim();
    const otp = generateOtp();
    const otpExpiry = Date.now() + GUEST_OTP_TTL_MS;

    await GuestOtp.findOneAndUpdate(
      { email: cleanEmail },
      { otp, otpExpiry, verified: false },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    await sendOtpEmail(cleanEmail, otp, 'issue report verification');

    res.json({ message: 'OTP sent', expiresInSeconds: GUEST_OTP_TTL_MS / 1000 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/public/otp/verify  { email, otp }
// On success, returns a short-lived reportToken the frontend must attach
// when it calls POST /api/issues, proving this email was OTP-verified.
const verifyGuestOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const cleanEmail = email.toLowerCase().trim();
    const record = await GuestOtp.findOne({ email: cleanEmail });

    if (!record) return res.status(400).json({ message: 'No OTP request found for this email' });
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (Date.now() > record.otpExpiry) return res.status(400).json({ message: 'OTP expired — please request a new one' });

    record.verified = true;
    await record.save();

    const reportToken = jwt.sign(
      { email: cleanEmail, purpose: 'guest-report' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({ message: 'Verified', reportToken });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { sendGuestOtp, verifyGuestOtp };
