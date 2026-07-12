import { Navigate } from 'react-router-dom';
import { isLoggedIn, getUser } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRole }) => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  const user = getUser();
  if (allowedRole && user?.role !== allowedRole) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
