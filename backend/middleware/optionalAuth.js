const jwt = require('jsonwebtoken');

// Used on routes that behave differently for logged-in vs guest users
// (e.g. reporting an issue). Never blocks the request — just attaches
// req.user if a valid session cookie is present.
const optionalAuth = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Invalid/expired cookie — treat as a guest rather than failing the request
  }
  next();
};

module.exports = optionalAuth;
