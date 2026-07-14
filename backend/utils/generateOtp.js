// Numeric 6-digit OTP — easier for people to type than uuid-slice alphanumerics.
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = generateOtp;
