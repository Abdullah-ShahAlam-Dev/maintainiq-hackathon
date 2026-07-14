import { Navigate } from 'react-router-dom';
import { isLoggedIn, getUser } from '../utils/auth';

// allowedRoles: string | string[]. Superadmin always passes an 'admin' gate.
const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  const user = getUser();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : allowedRoles ? [allowedRoles] : null;

  if (roles) {
    const allowed = user?.role === 'superadmin' || roles.includes(user?.role);
    if (!allowed) return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
