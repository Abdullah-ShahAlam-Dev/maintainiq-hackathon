import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/axios';
import { saveAuth } from '../utils/auth';

const ROLE_HOME = {
  superadmin: '/admin',
  admin: '/admin',
  technician: '/technician',
  user: '/user'
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const infoMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      saveAuth(res.data.user);
      navigate(ROLE_HOME[res.data.user.role] || '/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>MaintainIQ Login</h2>
        {infoMessage && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{infoMessage}</p>}
        {error && <p className="error-text">{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        <p>No account? <Link to="/register">Register</Link></p>
      </form>
    </div>
  );
};

export default Login;
