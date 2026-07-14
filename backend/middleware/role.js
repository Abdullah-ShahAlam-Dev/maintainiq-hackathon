// Superadmin sits above the hierarchy and can access anything an admin can,
// so it always passes — routes only need to list 'admin' explicitly.
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'superadmin' || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied' });
  };
};

module.exports = allowRoles;
