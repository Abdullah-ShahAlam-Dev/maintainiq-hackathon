import { useEffect, useState } from 'react';
import api from '../api/axios';
import { getUser, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [assets, setAssets] = useState([]);
  const [issues, setIssues] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [form, setForm] = useState({ assetCode: '', name: '', category: '', location: '', condition: 'Good' });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = getUser();

  const loadData = async () => {
    try {
      const [assetsRes, issuesRes, techRes] = await Promise.all([
        api.get('/assets', { params: search ? { search } : {} }),
        api.get('/issues'),
        api.get('/auth/technicians')
      ]);
      setAssets(assetsRes.data);
      setIssues(issuesRes.data);
      setTechnicians(techRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/assets', form);
      setForm({ assetCode: '', name: '', category: '', location: '', condition: 'Good' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create asset');
    }
  };

  const handleAssign = async (issueId, technicianId) => {
    if (!technicianId) return;
    try {
      await api.put(`/issues/${issueId}/assign`, { technicianId });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign technician');
    }
  };

  const openIssuesCount = issues.filter((i) => !['Resolved', 'Closed'].includes(i.status)).length;
  const criticalCount = issues.filter((i) => i.priority === 'Critical' && !['Resolved', 'Closed'].includes(i.status)).length;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>MaintainIQ — Admin</h1>
        <div>
          <span>{user?.name}</span>
          <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </header>

      {error && <p className="error-text">{error}</p>}

      <section className="summary-cards">
        <div className="card"><h3>{assets.length}</h3><p>Total Assets</p></div>
        <div className="card"><h3>{openIssuesCount}</h3><p>Open Issues</p></div>
        <div className="card critical"><h3>{criticalCount}</h3><p>Critical Issues</p></div>
      </section>

      <section>
        <h2>Register New Asset</h2>
        <form className="inline-form" onSubmit={handleCreateAsset}>
          <input name="assetCode" placeholder="Asset Code (e.g. PROJ-01)" value={form.assetCode} onChange={handleFormChange} required />
          <input name="name" placeholder="Name" value={form.name} onChange={handleFormChange} required />
          <input name="category" placeholder="Category" value={form.category} onChange={handleFormChange} required />
          <input name="location" placeholder="Location" value={form.location} onChange={handleFormChange} required />
          <input name="condition" placeholder="Condition" value={form.condition} onChange={handleFormChange} />
          <button type="submit">Add Asset</button>
        </form>
      </section>

      <section>
        <h2>Assets</h2>
        <input
          className="search-box"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="asset-grid">
          {assets.map((asset) => (
            <div key={asset._id} className="asset-card">
              <h3>{asset.name}</h3>
              <p>{asset.assetCode} — {asset.location}</p>
              <span className={`status-badge status-${asset.status.replace(/\s/g, '')}`}>{asset.status}</span>
              {asset.qrUrl && <img src={asset.qrUrl} alt="QR" width="100" />}
              <div className="asset-actions">
                <a href={`/asset/${asset.assetCode}`} target="_blank" rel="noreferrer">Open Public Page</a>
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/asset/${asset.assetCode}`)}>
                  Copy Link
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Issues</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Issue #</th><th>Title</th><th>Priority</th><th>Status</th><th>Assign Technician</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue._id} className={issue.priority === 'Critical' ? 'critical-row' : ''}>
                <td>{issue.issueNumber}</td>
                <td>{issue.title}</td>
                <td>{issue.priority}</td>
                <td>{issue.status}</td>
                <td>
                  <select
                    defaultValue={issue.assignedTechnician?._id || ''}
                    onChange={(e) => handleAssign(issue._id, e.target.value)}
                  >
                    <option value="">-- assign --</option>
                    {technicians.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;
