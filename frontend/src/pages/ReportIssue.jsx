import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { isLoggedIn, getUser } from '../utils/auth';
import OtpModal from '../components/OtpModal';

const ReportIssue = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const user = getUser();

  const [asset, setAsset] = useState(null);
  const [complaint, setComplaint] = useState('');
  const [reporterName, setReporterName] = useState(loggedIn ? user?.name || '' : '');
  const [reporterEmail, setReporterEmail] = useState(loggedIn ? user?.email || '' : '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [aiEdited, setAiEdited] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  const [fields, setFields] = useState({
    title: '',
    category: '',
    priority: 'Medium',
    possibleCauses: '',
    initialChecks: ''
  });

  useEffect(() => {
    api.get(`/public/asset/${code}`).then((res) => setAsset(res.data)).catch(() => setError('Asset not found'));
  }, [code]);

  const runAiTriage = async () => {
    if (!complaint.trim()) {
      setError('Describe the problem first');
      return;
    }
    setError('');
    setAiLoading(true);
    try {
      const res = await api.post('/ai/triage', {
        assetType: asset?.category,
        assetCondition: asset?.condition,
        assetLocation: asset?.location,
        complaint
      });

      if (res.data.aiUnavailable) {
        setError('AI suggestion unavailable right now — please fill the fields manually below');
      } else {
        setFields({
          title: res.data.title || '',
          category: res.data.category || '',
          priority: res.data.priority || 'Medium',
          possibleCauses: (res.data.possibleCauses || []).join(', '),
          initialChecks: (res.data.initialChecks || []).join(', ')
        });
        setAiSuggested(true);
        setAiEdited(false);
      }
    } catch (err) {
      setError('AI suggestion failed — please fill the fields manually below');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFields({ ...fields, [field]: value });
    if (aiSuggested) setAiEdited(true);
  };

  const submitIssue = async (reportToken) => {
    await api.post('/issues', {
      assetCode: code,
      title: fields.title,
      description: complaint,
      category: fields.category,
      priority: fields.priority,
      reporterInfo: { name: reporterName || 'Anonymous', email: reporterEmail },
      aiSuggested,
      aiEdited,
      reportToken
    });
    setSubmitted(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fields.title || !fields.category) {
      setError('Title and category are required — run AI suggestion or fill manually');
      return;
    }

    if (loggedIn) {
      // Logged-in users bypass OTP entirely — the session cookie is enough.
      try {
        await submitIssue(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to submit issue');
      }
      return;
    }

    if (!reporterEmail) {
      setError('Email is required to verify your report');
      return;
    }

    setOtpSending(true);
    try {
      await api.post('/public/otp/send', { email: reporterEmail });
      setShowOtp(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpVerify = async (otp) => {
    try {
      const res = await api.post('/public/otp/verify', { email: reporterEmail, otp });
      await submitIssue(res.data.reportToken);
      setShowOtp(false);
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleOtpResend = async () => {
    await api.post('/public/otp/send', { email: reporterEmail });
  };

  if (submitted) {
    return (
      <div className="public-page">
        <div className="public-card">
          <h2>Thanks for reporting!</h2>
          <p>We will resolve it ASAP.</p>
          <button onClick={() => navigate(`/asset/${code}`)}>Back to Asset Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <div className="public-card">
        <h1>Report an Issue</h1>
        {asset && <p>Asset: <strong>{asset.name}</strong> ({asset.assetCode})</p>}
        {error && <p className="error-text">{error}</p>}

        {!loggedIn && (
          <>
            <input
              placeholder="Your name (optional)"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Your email (required to verify your report)"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              required
            />
          </>
        )}

        <textarea
          placeholder="Describe the problem in your own words..."
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          rows={4}
        />

        <button type="button" onClick={runAiTriage} disabled={aiLoading}>
          {aiLoading ? 'Analyzing...' : 'Get AI Suggestion'}
        </button>

        <form onSubmit={handleSubmit} className="issue-form">
          <label>Title</label>
          <input value={fields.title} onChange={(e) => handleFieldChange('title', e.target.value)} required />

          <label>Category</label>
          <input value={fields.category} onChange={(e) => handleFieldChange('category', e.target.value)} required />

          <label>Priority</label>
          <select value={fields.priority} onChange={(e) => handleFieldChange('priority', e.target.value)}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>

          <label>Possible Causes (AI suggested — editable)</label>
          <textarea value={fields.possibleCauses} onChange={(e) => handleFieldChange('possibleCauses', e.target.value)} rows={2} />

          <label>Initial Checks (AI suggested — editable)</label>
          <textarea value={fields.initialChecks} onChange={(e) => handleFieldChange('initialChecks', e.target.value)} rows={2} />

          <button type="submit" disabled={otpSending}>
            {loggedIn ? 'Submit Issue' : otpSending ? 'Sending code...' : 'Submit & Verify Email'}
          </button>
        </form>
      </div>

      {showOtp && (
        <OtpModal
          email={reporterEmail}
          durationSeconds={120}
          title="Verify your report"
          onVerify={handleOtpVerify}
          onResend={handleOtpResend}
          onClose={() => setShowOtp(false)}
        />
      )}
    </div>
  );
};

export default ReportIssue;
