import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import PublicAssetPage from './pages/PublicAssetPage';
import ReportIssue from './pages/ReportIssue';
import ProtectedRoute from './components/ProtectedRoute';
import { isLoggedIn, getUser } from './utils/auth';

const RootRedirect = () => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  const user = getUser();
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/technician'} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/asset/:code" element={<PublicAssetPage />} />
      <Route path="/report/:code" element={<ReportIssue />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRole="technician">
            <TechnicianDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
