const mongoose = require('mongoose');

// Short-lived OTP record for guests reporting an issue without an account.
// One document per email — re-requesting an OTP overwrites the previous one.
const guestOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    otp: { type: String, required: true },
    otpExpiry: { type: Number, required: true }, // Date.now() + 2 minutes
    verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GuestOtp', guestOtpSchema);
