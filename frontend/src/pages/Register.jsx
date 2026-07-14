import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { saveAuth } from '../utils/auth';
import OtpModal from '../components/OtpModal';

const SPECIALTIES = ['Electrical', 'Mechanical', 'HVAC', 'Plumbing', 'IT/Networking', 'General Maintenance'];

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', specialty: '' });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const navigate = useNavigate();

  const isTechnician = form.role === 'technician';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isTechnician && (!form.specialty || !evidenceFile)) {
      setError('Specialty and a certification/evidence document are required for technician signup');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('email', form.email);
      payload.append('password', form.password);
      payload.append('role', form.role);
      if (isTechnician) {
        payload.append('specialty', form.specialty);
        payload.append('evidence', evidenceFile);
      }

      await api.post('/auth/register', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowOtp(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (otp) => {
    try {
      const res = await api.post('/auth/verify-otp', { email: form.email, otp });
      if (res.data.user) {
        // 'user' role is auto-approved — verifying OTP logs them straight in
        saveAuth(res.data.user);
        navigate('/user');
      } else {
        // technician/admin — awaiting admin approval
        setShowOtp(false);
        navigate('/login', { state: { message: res.data.message } });
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleResend = async () => {
    await api.post('/auth/resend-otp', { email: form.email });
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        {error && <p className="error-text">{error}</p>}
        <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="user">User (Reporter)</option>
          <option value="technician">Technician</option>
          <option value="admin">Admin</option>
        </select>

        {isTechnician && (
          <>
            <select name="specialty" value={form.specialty} onChange={handleChange} required>
              <option value="">Select specialty...</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Certification / evidence document
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setEvidenceFile(e.target.files[0])}
                required
                style={{ marginTop: '0.3rem' }}
              />
            </label>
          </>
        )}

        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </form>

      {showOtp && (
        <OtpModal
          email={form.email}
          durationSeconds={600}
          title="Verify your email"
          onVerify={handleVerify}
          onResend={handleResend}
          onClose={() => setShowOtp(false)}
        />
      )}
    </div>
  );
};

export default Register;
