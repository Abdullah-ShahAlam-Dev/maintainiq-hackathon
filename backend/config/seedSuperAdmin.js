const bcrypt = require('bcrypt');
const User = require('../models/User');

// Runs once at server startup. The Super Admin is never created through the
// public signup form — only via SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD env vars.
const seedSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.warn('SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping super admin seed');
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return;

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name: 'Super Admin',
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'superadmin',
      status: 'approved',
      isVerified: true
    });

    console.log(`Super Admin account seeded for ${email}`);
  } catch (err) {
    console.error('Super Admin seed failed:', err.message);
  }
};

module.exports = seedSuperAdmin;
