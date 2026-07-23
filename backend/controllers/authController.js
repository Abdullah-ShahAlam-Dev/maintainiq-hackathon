const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const generateOtp = require("../utils/generateOtp");
const { sendOtpEmail } = require("../utils/sendEmail");
const { sendAccessGrantedEmail } = require("../utils/sendAccessEmail");
const { sendWelcomeEmail } = require("../utils/sendWelcomeEmail");
const { sendPendingEmail } = require("../utils/sendPendingEmail");
const { sendRevokedEmail } = require("../utils/sendRevokedEmail");

const SIGNUP_OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes onverting from Miliseocnd

// secure+sameSite:'none' is REQUIRED in production (frontend/backend on
// different HTTPS domains — Vercel/Render) but BREAKS on local HTTP testing,
// since browsers refuse to set/send secure cookies over a plain http://
// connection. Render sets NODE_ENV=production automatically; locally it's
// unset, so this switches correctly without you touching anything.
const isProd = process.env.NODE_ENV === "production";
// Local me NODE_ENV aksar undefined hota hai unless manually set. — yehi cheez isProd ko false bana deti hai, jo local testing ke liye zaroori hai
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd, // required true for cross-site cookies (frontend/backend on different domains) like vercel+render
  sameSite: isProd ? "none" : "lax", // "lax" for local HTTP; "none" + secure for production (cross-site HTTPS)
  maxAge: 1 * 24 * 60 * 60 * 1000,
};

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

const uploadEvidence = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "maintainiq-verification" },
      (error, result) => (result ? resolve(result) : reject(error)),
    );
    stream.end(buffer);
  });

// ---------------------------------------------------------------------------
// Step 1 of signup: create/refresh a pending, unverified user and email an OTP.
// The account is NOT usable until verifyOtp succeeds.
// ---------------------------------------------------------------------------
const register = async (req, res) => {
  try {
    const { name, email, password, role, specialty } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const finalRole = ["admin", "technician"].includes(role) ? role : "user";

    if (finalRole === "technician" && !specialty) {
      return res
        .status(400)
        .json({ message: "Specialty is required for technician signup" });
    }
    if (finalRole === "technician" && !req.file) {
      return res
        .status(400)
        .json({
          message:
            "Certification/evidence document is required for technician signup",
        });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing && existing.isVerified) {
      return res.status(400).json({ message: "Email already registered" });
    }

    let profilePic = existing?.profilePic || null;
    if (req.file) {
      const result = await uploadEvidence(req.file.buffer);
      profilePic = result.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpiry = Date.now() + SIGNUP_OTP_TTL_MS;

    // 'user' role doesn't need admin approval — it just needs email verification.
    const initialStatus = finalRole === "user" ? "approved" : "pending";

    const userDoc = {
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: finalRole,
      status: initialStatus,
      specialty: finalRole === "technician" ? specialty : "",
      profilePic,
      isVerified: false,
      otp,
      otpExpiry,
    };

    if (existing) {
      Object.assign(existing, userDoc);
      await existing.save();
    } else {
      await User.create(userDoc);
    }

    await sendOtpEmail(cleanEmail, otp, "account verification");

    //adding Emails Features calls from here
    if (finalRole === "user") {
      await sendWelcomeEmail(cleanEmail, name);
    }

    if (["admin", "technician"].includes(finalRole)) {
      await sendPendingEmail(cleanEmail, name, finalRole);
    }

    res
      .status(200)
      .json({
        message: "OTP sent to your email. Verify to complete signup.",
        email: cleanEmail,
      });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// Step 2 of signup: verify the OTP. If the account is already auto-approved
// (role 'user'), log them straight in via cookie. Otherwise they wait in the
// Approvals tab for an admin/superadmin.
// ---------------------------------------------------------------------------
const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res
        .status(404)
        .json({ message: "No signup found for this email" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (Date.now() > user.otpExpiry)
      return res
        .status(400)
        .json({ message: "OTP expired — please request a new one" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    if (user.status === "approved") {
      const token = generateToken(user);
      res.cookie("token", token, COOKIE_OPTIONS);
      return res.json({
        message: "Email verified",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    res.json({
      message: "Email verified. Your account is awaiting admin approval.",
      pendingApproval: true,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (!user || user.isVerified) {
      return res
        .status(400)
        .json({ message: "No pending signup found for this email" });
    }
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = Date.now() + SIGNUP_OTP_TTL_MS;
    await user.save();
    await sendOtpEmail(user.email, otp, "account verification");
    res.json({ message: "A new OTP has been sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res
        .status(403)
        .json({
          message: "Please verify your email via OTP before logging in",
        });
    }
    if (user.status === "pending") {
      return res
        .status(403)
        .json({ message: "Your account is awaiting admin approval" });
    }
    if (user.status === "revoked") {
      return res
        .status(403)
        .json({
          message: "Your access has been revoked. Contact an administrator.",
        });
    }

    const token = generateToken(user);
    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const logout = (req, res) => {
  res.clearCookie("token", { ...COOKIE_OPTIONS, maxAge: undefined });
  res.json({ message: "Logged out" });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role status",
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// Approvals tab: strictly status === 'pending'
// ---------------------------------------------------------------------------
const getPendingUsers = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role || !["admin", "technician"].includes(role)) {
      return res
        .status(400)
        .json({ message: 'role query param must be "admin" or "technician"' });
    }
    // Only a superadmin may see pending admin signups
    if (role === "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find({ role, status: "pending", isVerified: true })
      .select("name email specialty profilePic createdAt")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// Management tabs: everyone already processed (approved or revoked) — never pending
// ---------------------------------------------------------------------------
const getManagementList = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role || !["admin", "technician", "user"].includes(role)) {
      return res
        .status(400)
        .json({
          message: 'role query param must be "admin", "technician" or "user"',
        });
    }
    if (role === "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find({
      role,
      status: { $in: ["approved", "revoked"] },
    })
      .select("name email specialty createdAt approvedBy status")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Single endpoint for: initial Approve/Reject in the Approvals tab, AND the
// Granted/Revoked toggle in the Management tabs — both just set `status`.
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "revoked"].includes(status)) {
      return res
        .status(400)
        .json({ message: 'status must be "approved" or "revoked"' });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    // Only a superadmin can approve/revoke another admin
    if (target.role === "admin" && req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Only a Super Admin can manage admin accounts" });
    }

    const actor = await User.findById(req.user.id).select("name");

    target.status = status;
    target.approvedBy = actor?.name || req.user.name || "Unknown";
    await target.save();
    // after saving in Db then sending these emails

    // SENDING EMIAL SECTIONS AFTER STATUS CHNAGED 
    console.log("===== APPROVING USER =====");
    console.log(target.email);
    if (status === "approved") {
      await sendAccessGrantedEmail(target.email, target.name, target.role);
    }

    console.log("===== REVOKING USER =====");
    console.log(target.email);
    if (status === "revoked") {
      await sendRevokedEmail(target.email, target.name, target.role);
    }

    res.json({
      id: target._id,
      name: target.name,
      email: target.email,
      status: target.status,
      approvedBy: target.approvedBy,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Server-side enforced: only a revoked account may be deleted, matching the
// disabled-until-revoked Delete button on the frontend.
const deleteUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.status !== "revoked") {
      return res
        .status(400)
        .json({ message: "Only a revoked account can be deleted" });
    }
    if (target.role === "admin" && req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Only a Super Admin can delete an admin account" });
    }

    await target.deleteOne();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Assignment dropdown on Issue Management — approved technicians only
const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({
      role: "technician",
      status: "approved",
    }).select("name email");
    res.json(technicians);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
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
  getTechnicians,
};
