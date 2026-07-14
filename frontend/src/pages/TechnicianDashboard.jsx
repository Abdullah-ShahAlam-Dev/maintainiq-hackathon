import { useEffect, useState } from 'react';
import api from '../api/axios';
import { getUser, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

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
    
    // LOG 1: Button click hotay hi data check karo
    console.log("👉 1. BUTTON CLICKED! Issue ID:", issueId);
    console.log("👉 2. FORM DATA TO SEND:", data);

    if (!data?.notes || data.cost === undefined) {
      console.error("❌ 3. VALIDATION FAILED: Notes or Cost is missing!");
      alert("Validation Error: Notes aur Cost lazmi likhein!");
      setError('Notes and cost are required');
      return;
    }
    
    try {
      // LOG 2: Backend ko request bhejte waqt
      console.log("⏳ 4. SENDING API REQUEST to /maintenance...");
      
      await api.post('/maintenance', {
        issueId,
        notes: data.notes,
        cost: Number(data.cost),
        timeSpent: Number(data.timeSpent) || 0,
        finalCondition: data.finalCondition || 'Good'
      });
      
      // LOG 3: Agar request successfully save ho jaye
      console.log("✅ 5. API SUCCESS! Data saved.");
      alert("Success: Maintenance note successfully save ho gaya hai!");
      
      setError('');
      loadIssues();
    } catch (err) {
      // LOG 4: Agar backend se koi error aaye
      console.error("❌ 6. API CATCH ERROR:", err);
      console.error("❌ ERROR DETAILS:", err.response?.data?.message || err.message);
      
      const errorMsg = err.response?.data?.message || 'Failed to add maintenance record';
      alert("API Error: " + errorMsg);
      setError(errorMsg);
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
        <h1>MaintainIQ — Technician</h1>
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
            <p>Priority: <strong>{issue.priority}</strong> | Status: <strong>{issue.status}</strong></p>

            {NEXT_STATUS[issue.status] && (
              <button onClick={() => handleStatusChange(issue._id, issue.status)}>
                Move to: {NEXT_STATUS[issue.status]}
              </button>
            )}

            {issue.status === 'Maintenance In Progress' && (
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