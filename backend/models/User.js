const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // 'user' = normal registered reporter, no admin approval needed.
    // 'technician' / 'admin' require approval before they can log in.
    // 'superadmin' is seeded once at server startup (see config/seedSuperAdmin.js) — not signed up.
    role: {
      type: String,
      enum: ['user', 'admin', 'technician', 'superadmin'],
      default: 'user'
    },

    // Approval workflow state. 'user' and 'superadmin' skip straight to 'approved'.
    status: {
      type: String,
      enum: ['pending', 'approved', 'revoked'],
      default: 'pending'
    },

    // Email OTP verification (separate from admin approval status above).
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiry: { type: Number, default: null },

    // Technician-only fields
    specialty: { type: String, default: '' },
    profilePic: { type: String, default: null }, // Cloudinary URL of certification/evidence doc

    // Name of the admin/superadmin who last approved or revoked this account
    approvedBy: { type: String, default: null }
  },
  { timestamps: true } // gives us createdAt for free
);

module.exports = mongoose.model('User', userSchema);
