import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const STATUS_CLASS = {
  Operational: 'text-success border-success',
  'Issue Reported': 'text-hazard border-hazard',
  'Under Inspection': 'text-[#1d5a8a] border-[#1d5a8a]',
  'Under Maintenance': 'text-[#1d5a8a] border-[#1d5a8a]',
  'Out of Service': 'text-critical border-critical',
  Retired: 'text-critical border-critical'
};

// Public landing page ("/") — mirrors the Admin Overview tab's UX (table/card
// toggle, category/status filters, sort) but read-only: no add-asset form,
// and the QR codes ARE shown here since scanning them is the whole point.
const AssetRegistry = () => {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('card'); // 'card' | 'table'
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/public/assets', { params: search ? { search } : {} })
      .then((res) => setAssets(res.data))
      .catch(() => setError('Failed to load asset registry'));
  }, [search]);

  const categories = useMemo(
    () => [...new Set(assets.map((a) => a.category).filter(Boolean))],
    [assets]
  );
  const statuses = useMemo(
    () => [...new Set(assets.map((a) => a.status).filter(Boolean))],
    [assets]
  );

  const visibleAssets = useMemo(() => {
    let list = assets.filter(
      (a) =>
        (!categoryFilter || a.category === categoryFilter) &&
        (!statusFilter || a.status === statusFilter)
    );
    switch (sortBy) {
      case 'name-desc':
        list = [...list].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'status':
        list = [...list].sort((a, b) => a.status.localeCompare(b.status));
        break;
      case 'name-asc':
      default:
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [assets, categoryFilter, statusFilter, sortBy]);

  return (
    <div className="min-h-screen bg-base font-sans text-ink">
      <header className="bg-ink text-white border-b-[3px] border-hazard">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-mono text-sm uppercase tracking-tag m-0">MaintainIQ</h1>
          <Link
            to="/login"
            className="bg-brand hover:bg-brand-dark text-white font-mono text-xs uppercase tracking-tag px-4 py-2 rounded-sm"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="font-mono text-xs uppercase tracking-tag text-muted border-b border-line pb-2 mb-4">
          Asset Registry
        </h2>

        {error && <p className="error-text mb-4">{error}</p>}

        <input
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />

        {/* Toolbar — same pattern as the Admin Overview/Issue Management tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-panel border border-line rounded-sm px-4 py-3 mb-5">
          <div className="flex gap-2">
            <button
              onClick={() => setView('card')}
              className={`font-mono text-[11px] uppercase tracking-tag px-3 py-1.5 rounded-sm ${
                view === 'card' ? 'bg-brand text-white' : 'bg-transparent text-ink border border-line'
              }`}
            >
              Card
            </button>
            <button
              onClick={() => setView('table')}
              className={`font-mono text-[11px] uppercase tracking-tag px-3 py-1.5 rounded-sm ${
                view === 'table' ? 'bg-brand text-white' : 'bg-transparent text-ink border border-line'
              }`}
            >
              Table
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-line rounded-sm px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-brand"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-line rounded-sm px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-brand"
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-line rounded-sm px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-brand"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {view === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleAssets.map((asset) => (
              <div
                key={asset._id}
                className="bg-panel border border-line rounded-sm p-4 hover:border-brand transition-colors"
              >
                <h3 className="text-sm font-semibold m-0 mb-1">{asset.name}</h3>
                <p className="text-xs text-muted font-mono m-0">
                  {asset.assetCode} — {asset.location}
                </p>
                <span
                  className={`inline-block mt-2 mb-2 px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${
                    STATUS_CLASS[asset.status] || 'text-muted border-muted'
                  }`}
                >
                  {asset.status}
                </span>
                {asset.qrUrl && (
                  <img src={asset.qrUrl} alt="Scan to open asset page" width="110" className="block mb-2" />
                )}
                <Link
                  to={`/asset/${asset.assetCode}`}
                  className="font-mono text-[11px] uppercase tracking-tag text-brand"
                >
                  Open Public Page →
                </Link>
              </div>
            ))}
            {visibleAssets.length === 0 && !error && (
              <p className="text-sm text-muted col-span-full">No assets match these filters.</p>
            )}
          </div>
        ) : (
          <div className="bg-panel border border-line rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-ink text-white">
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Name</th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Code</th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Category</th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Location</th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Status</th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">QR</th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">View</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAssets.map((asset) => (
                    <tr key={asset._id} className="border-b border-line">
                      <td className="px-4 py-2.5 text-sm">{asset.name}</td>
                      <td className="px-4 py-2.5 text-sm font-mono">{asset.assetCode}</td>
                      <td className="px-4 py-2.5 text-sm text-muted">{asset.category}</td>
                      <td className="px-4 py-2.5 text-sm text-muted">{asset.location}</td>
                      <td className="px-4 py-2.5 text-sm">
                        <span className={`inline-block px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${STATUS_CLASS[asset.status] || 'text-muted border-muted'}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {asset.qrUrl && <img src={asset.qrUrl} alt="QR" width="48" />}
                      </td>
                      <td className="px-4 py-2.5 text-sm">
                        <Link to={`/asset/${asset.assetCode}`} className="font-mono text-[11px] uppercase tracking-tag text-brand">
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {visibleAssets.length === 0 && !error && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-sm text-muted text-center">No assets match these filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AssetRegistry;
