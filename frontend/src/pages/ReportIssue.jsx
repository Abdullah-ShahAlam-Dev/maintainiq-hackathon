import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ReportIssue = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [complaint, setComplaint] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [aiEdited, setAiEdited] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.title || !fields.category) {
      setError('Title and category are required — run AI suggestion or fill manually');
      return;
    }
    try {
      await api.post('/issues', {
        assetCode: code,
        title: fields.title,
        description: complaint,
        category: fields.category,
        priority: fields.priority,
        reporterInfo: { name: reporterName || 'Anonymous' },
        aiSuggested,
        aiEdited
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit issue');
    }
  };

  if (submitted) {
    return (
      <div className="public-page">
        <div className="public-card">
          <h2>Issue Reported Successfully</h2>
          <p>Thank you — the maintenance team has been notified.</p>
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

        <input
          placeholder="Your name (optional)"
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
        />

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

          <button type="submit">Submit Issue</button>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;
