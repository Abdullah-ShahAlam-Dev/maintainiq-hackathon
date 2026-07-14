const OverviewTab = ({
  assets,
  issues,
  form,
  onFormChange,
  onCreateAsset,
  search,
  onSearchChange,
}) => {
  const openIssuesCount = issues.filter((i) => !['Resolved', 'Closed'].includes(i.status)).length;
  const criticalCount = issues.filter(
    (i) => i.priority === 'Critical' && !['Resolved', 'Closed'].includes(i.status)
  ).length;

  return (
    <div className="space-y-8">
      {/* Summary gauges */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-panel border border-line border-l-4 border-l-brand rounded-sm p-5">
          <h3 className="font-mono text-3xl text-ink m-0">{assets.length}</h3>
          <p className="text-xs uppercase tracking-tag text-muted mt-1 mb-0">Total Assets</p>
        </div>
        <div className="bg-panel border border-line border-l-4 border-l-hazard rounded-sm p-5">
          <h3 className="font-mono text-3xl text-ink m-0">{openIssuesCount}</h3>
          <p className="text-xs uppercase tracking-tag text-muted mt-1 mb-0">Open Issues</p>
        </div>
        <div className="bg-panel border border-line border-l-4 border-l-critical rounded-sm p-5">
          <h3 className="font-mono text-3xl text-critical m-0">{criticalCount}</h3>
          <p className="text-xs uppercase tracking-tag text-muted mt-1 mb-0">Critical Issues</p>
        </div>
      </section>

      {/* Register new asset */}
      <section className="bg-panel border border-line rounded-sm">
        <div className="border-b border-line px-5 py-3">
          <h2 className="font-mono text-xs uppercase tracking-tag text-muted m-0">
            Register New Asset
          </h2>
        </div>
        <form onSubmit={onCreateAsset} className="p-5 flex flex-wrap gap-3">
          <input
            name="assetCode"
            placeholder="Asset Code (e.g. PROJ-01)"
            value={form.assetCode}
            onChange={onFormChange}
            required
            className="flex-1 min-w-[160px] border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={onFormChange}
            required
            className="flex-1 min-w-[160px] border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <input
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={onFormChange}
            required
            className="flex-1 min-w-[140px] border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <input
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={onFormChange}
            required
            className="flex-1 min-w-[140px] border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <input
            name="condition"
            placeholder="Condition"
            value={form.condition}
            onChange={onFormChange}
            className="flex-1 min-w-[120px] border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-mono text-xs font-semibold uppercase tracking-tag px-5 py-2 rounded-sm transition-colors"
          >
            Add Asset
          </button>
        </form>
      </section>

      {/* Asset registry */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-xs uppercase tracking-tag text-muted m-0 border-b-0">
            Asset Registry
          </h2>
          <input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset._id}
              className="relative bg-panel border border-line rounded-sm p-4 before:content-[''] before:absolute before:top-2 before:left-2 before:w-[5px] before:h-[5px] before:rounded-full before:bg-line after:content-[''] after:absolute after:top-2 after:right-2 after:w-[5px] after:h-[5px] after:rounded-full after:bg-line"
            >
              <h3 className="text-sm font-semibold m-0 mb-1">{asset.name}</h3>
              <p className="text-xs text-muted font-mono m-0">
                {asset.assetCode} — {asset.location}
              </p>
              <span
                className={`inline-block mt-2 mb-1 px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${
                  asset.status === 'Operational'
                    ? 'text-success border-success'
                    : asset.status === 'Issue Reported'
                    ? 'text-hazard border-hazard'
                    : asset.status === 'Under Inspection' || asset.status === 'Under Maintenance'
                    ? 'text-[#1d5a8a] border-[#1d5a8a]'
                    : 'text-critical border-critical'
                }`}
              >
                {asset.status}
              </span>
              {asset.qrUrl && (
                <img src={asset.qrUrl} alt="QR code" width="90" className="mt-1" />
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                <a
                  href={`/asset/${asset.assetCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="self-center font-mono text-[11px] uppercase tracking-tag text-brand"
                >
                  Open Public Page
                </a>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(`${window.location.origin}/asset/${asset.assetCode}`)
                  }
                  className="bg-ink hover:bg-black text-white font-mono text-[10px] px-2.5 py-1.5 rounded-sm"
                >
                  Copy Link
                </button>
              </div>
            </div>
          ))}
          {assets.length === 0 && (
            <p className="text-sm text-muted col-span-full">No assets match this search.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default OverviewTab;
