import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getUser, logout } from '../utils/auth';

const STATUS_STYLES = {
  Reported: 'text-hazard border-hazard',
  Resolved: 'text-success border-success',
  Closed: 'text-muted border-muted'
};

const UserDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    api
      .get('/issues', { params: { reporterEmail: user?.email } })
      .then((res) => setIssues(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load your issues'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-base font-sans text-ink">
      <header className="bg-ink text-white border-b-[3px] border-hazard">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-mono text-sm uppercase tracking-tag m-0">MaintainIQ / My Account</h1>
          <div className="flex items-center gap-4 font-mono text-sm">
            <span>{user?.name}</span>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="bg-transparent border border-white/30 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-tag px-3 py-1.5 rounded-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="font-mono text-xs uppercase tracking-tag text-muted border-b border-line pb-2 mb-4">
          My Reported Issues
        </h2>

        {error && <p className="error-text mb-4">{error}</p>}

        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue._id} className="bg-panel border border-line border-l-4 border-l-brand rounded-sm p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm m-0">{issue.issueNumber} — {issue.title}</h3>
                <span
                  className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${
                    STATUS_STYLES[issue.status] || 'text-[#1d5a8a] border-[#1d5a8a]'
                  }`}
                >
                  {issue.status}
                </span>
              </div>
              <p className="text-sm text-muted mt-1 mb-0">{issue.description}</p>
              {issue.assetId && (
                <p className="text-xs font-mono text-muted mt-1 mb-0">
                  Asset: {issue.assetId.name} ({issue.assetId.assetCode})
                </p>
              )}
            </div>
          ))}
          {issues.length === 0 && !error && (
            <p className="text-sm text-muted">You haven't reported any issues yet.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
