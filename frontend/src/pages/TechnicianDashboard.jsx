import { useEffect, useState } from 'react';
import api from '../api/axios';
import { getUser, logout } from '../utils/auth';
import { useNavigate, Link} from 'react-router-dom';


const NEXT_STATUS = {
  Assigned: 'Inspection Started',
  'Inspection Started': 'Maintenance In Progress',
  'Maintenance In Progress': 'Resolved'
};

const TechnicianDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');
  const [noteForm, setNoteForm] = useState({});
  const navigate = useNavigate();
  const user = getUser();

  const loadIssues = async () => {
    try {
      const res = await api.get('/issues', { params: { technician: user.id } });
      setIssues(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issues');
    }
  };

  useEffect(() => {
    loadIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNoteChange = (issueId, field, value) => {
    setNoteForm({ ...noteForm, [issueId]: { ...noteForm[issueId], [field]: value } });
  };

  const handleAddMaintenance = async (issueId) => {
    const data = noteForm[issueId];
    if (!data?.notes || data.cost === undefined) {
      setError('Notes and cost are required');
      return;
    }
    try {
      await api.post('/maintenance', {
        issueId,
        notes: data.notes,
        cost: Number(data.cost),
        timeSpent: Number(data.timeSpent) || 0,
        finalCondition: data.finalCondition || 'Good'
      });
      setError('');
      loadIssues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add maintenance record');
    }
  };

  const handleStatusChange = async (issueId, currentStatus) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    try {
      await api.put(`/issues/${issueId}/status`, { status: next });
      loadIssues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
            <h1 className="font-mono text-base uppercase tracking-tag m-0">
               <Link
              to="/"
              className="text-inherit no-underline hover:opacity-90 transition"
            >
              MaintainIQ
            </Link>
            {" "}
            <span
              className="text-hazard font-sans font-black inline-block mx-1"
              style={{ WebkitTextStroke: "3px" }}
            >
              /
            </span>{" "}
            Technician
          </h1>

        <div>
          <span>{user?.name}</span>
          <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </header>

      {error && <p className="error-text">{error}</p>}

      <section>
        <h2>My Assigned Issues</h2>
        {issues.length === 0 && <p>No issues assigned yet.</p>}
        {issues.map((issue) => (
          <div key={issue._id} className="issue-card">
            <h3>{issue.issueNumber} — {issue.title}</h3>
            <p>{issue.description}</p>
            <p>
              Priority: <strong>{issue.priority}</strong> | Status: <strong>{issue.status}</strong>
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
              {issue.assetId ? (
                <span style={{ color: 'var(--muted)' }}>
                  Asset: {issue.assetId.name} ({issue.assetId.assetCode})
                </span>
              ) : (
                <span style={{ color: 'var(--critical)', fontWeight: 700 }}>Asset Removed</span>
              )}
            </p>

            {!issue.assetId && !['Resolved', 'Closed'].includes(issue.status) && (
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                This asset has been removed from the registry by the owner — no further action is required on this issue.
              </p>
            )}

            {issue.assetId && NEXT_STATUS[issue.status] && (
              <button onClick={() => handleStatusChange(issue._id, issue.status)}>
                Move to: {NEXT_STATUS[issue.status]}
              </button>
            )}

            {issue.assetId && issue.status === 'Maintenance In Progress' && (
              <div className="maintenance-form">
                <h4>Add Maintenance Note (required before resolving)</h4>
                <textarea
                  placeholder="What did you find/fix?"
                  onChange={(e) => handleNoteChange(issue._id, 'notes', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Cost"
                  onChange={(e) => handleNoteChange(issue._id, 'cost', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Time spent (minutes)"
                  onChange={(e) => handleNoteChange(issue._id, 'timeSpent', e.target.value)}
                />
                <input
                  placeholder="Final condition"
                  onChange={(e) => handleNoteChange(issue._id, 'finalCondition', e.target.value)}
                />
                <button onClick={() => handleAddMaintenance(issue._id)}>Save Maintenance Note</button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};

export default TechnicianDashboard;