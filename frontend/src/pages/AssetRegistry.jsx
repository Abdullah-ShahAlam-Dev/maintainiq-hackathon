import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

// Public landing page ("/"). Read-only card view — registering assets stays
// inside the Admin Dashboard, this is just the public directory + QR entry point.
const AssetRegistry = () => {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/public/assets', { params: search ? { search } : {} })
      .then((res) => setAssets(res.data))
      .catch(() => setError('Failed to load asset registry'));
  }, [search]);

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
          className="w-full mb-5 border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <Link
              key={asset._id}
              to={`/asset/${asset.assetCode}`}
              className="block bg-panel border border-line rounded-sm p-4 hover:border-brand transition-colors no-underline text-ink"
            >
              <h3 className="text-sm font-semibold m-0 mb-1">{asset.name}</h3>
              <p className="text-xs text-muted font-mono m-0">
                {asset.assetCode} — {asset.location}
              </p>
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${
                  asset.status === 'Operational'
                    ? 'text-success border-success'
                    : asset.status === 'Issue Reported'
                    ? 'text-hazard border-hazard'
                    : 'text-critical border-critical'
                }`}
              >
                {asset.status}
              </span>
            </Link>
          ))}
          {assets.length === 0 && !error && (
            <p className="text-sm text-muted col-span-full">No assets found.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default AssetRegistry;
