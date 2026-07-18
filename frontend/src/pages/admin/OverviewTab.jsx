import { useState } from "react";
import { ASSET_CATEGORIES, OTHER_CATEGORY } from "../../constants/categories";
import AssetEditModal from "./AssetEditModal";
import { generateAssetPoster } from "../../utils/generateAssetPoster";

const OverviewTab = ({
  assets,
  onImageChange,
  issues,
  form,
  onFormChange,
  onCreateAsset,
  search,
  onSearchChange,
  isSuperAdmin,
  onUpdateAsset,
  onDeleteAsset,
}) => {
  const [assetView, setAssetView] = useState("table"); // 'card' | 'table'
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [editingAsset, setEditingAsset] = useState(null);

  // If the current form.category isn't one of the fixed options, treat the
  // dropdown as being on "Other" so the custom text input shows and keeps
  // whatever was already typed instead of silently clearing it.
  const [showCustomCategory, setShowCustomCategory] = useState(
    Boolean(form.category) && !ASSET_CATEGORIES.includes(form.category),
  );

  const handleCategorySelect = (e) => {
    const value = e.target.value;
    if (value === OTHER_CATEGORY) {
      setShowCustomCategory(true);
      onFormChange({ target: { name: "category", value: "" } });
    } else {
      setShowCustomCategory(false);
      onFormChange({ target: { name: "category", value } });
    }
  };

  const handleDelete = async (asset) => {
    if (
      !window.confirm(
        `Delete "${asset.name}" (${asset.assetCode}) permanently? Related issues stay as history but will show "Asset Removed".`,
      )
    ) {
      return;
    }
    await onDeleteAsset(asset._id);
  };

  const assetStatuses = [
    ...new Set(assets.map((a) => a.status).filter(Boolean)),
  ];

  const visibleAssets = assets
    .filter(
      (a) =>
        (!categoryFilter ||
          (categoryFilter === OTHER_CATEGORY
            ? !ASSET_CATEGORIES.includes(a.category)
            : a.category === categoryFilter)) &&
        (!statusFilter || a.status === statusFilter),
    )
    .sort((a, b) => {
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return a.name.localeCompare(b.name); // name-asc (default)
    });

  // Issues whose asset has since been deleted (assetId fails to populate,
  // resolving to null) are no longer actionable — exclude them from the
  // live counters. They still show in Issue Management as history.
  const openIssuesCount = issues.filter(
    (i) => !["Resolved", "Closed"].includes(i.status) && i.assetId,
  ).length;
  const criticalCount = issues.filter(
    (i) =>
      i.priority === "Critical" &&
      !["Resolved", "Closed"].includes(i.status) &&
      i.assetId,
  ).length;

  return (
    <div className="space-y-8">
      {/* Summary gauges */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-panel border border-line border-l-4 border-l-brand rounded-sm p-5">
          <h3 className="font-mono text-3xl text-ink m-0">{assets.length}</h3>
          <p className="text-xs uppercase tracking-tag text-muted mt-1 mb-0">
            Total Assets
          </p>
        </div>
        <div className="bg-panel border border-line border-l-4 border-l-hazard rounded-sm p-5">
          <h3 className="font-mono text-3xl text-ink m-0">{openIssuesCount}</h3>
          <p className="text-xs uppercase tracking-tag text-muted mt-1 mb-0">
            Open Issues
          </p>
        </div>
        <div className="bg-panel border border-line border-l-4 border-l-critical rounded-sm p-5">
          <h3 className="font-mono text-3xl text-critical m-0">
            {criticalCount}
          </h3>
          <p className="text-xs uppercase tracking-tag text-muted mt-1 mb-0">
            Critical Issues
          </p>
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
          <select
            name="category"
            value={showCustomCategory ? OTHER_CATEGORY : form.category}
            onChange={handleCategorySelect}
            required
            className="flex-1 min-w-[140px] border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Select category...</option>
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={OTHER_CATEGORY}>{OTHER_CATEGORY}</option>
          </select>
          {showCustomCategory && (
            <input
              name="category"
              placeholder="Specify category"
              value={form.category}
              onChange={onFormChange}
              required
              className="flex-1 min-w-[140px] border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          )}
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
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onImageChange(e.target.files[0])}
            className="flex-1 min-w-[160px] text-sm"
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
        {/* Toolbar row — Card/Table left, filters + small search right */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-panel border border-line border-t-0 px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setAssetView("table")}
              className={`font-mono text-[11px] hover:!text-white uppercase tracking-tag px-3 py-1.5 rounded-sm ${
                assetView === "table"
                  ? "bg-brand text-white"
                  : "bg-transparent text-ink border border-line"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setAssetView("card")}
              className={`font-mono text-[11px] uppercase tracking-tag px-3 hover:!text-white py-1.5 rounded-sm ${
                assetView === "card"
                  ? "bg-brand text-white"
                  : "bg-transparent text-ink border border-line"
              }`}
            >
              Card
            </button>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-line rounded-sm px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-brand"
            >
              <option value="">All categories</option>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={OTHER_CATEGORY}>Other</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-line rounded-sm px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-brand"
            >
              <option value="">All statuses</option>
              {assetStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
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
            {/* Small search box — not full-width like the public page */}
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-40 border border-line rounded-sm px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Heading row — its own row, background band marks new section */}
        <div className="bg-ink px-5 py-3 rounded-t-sm border-b-[5px] border-hazard">
          <h2 className="font-mono text-xs uppercase tracking-tag text-white m-0 border-b-0">
            Asset Registry
          </h2>
        </div>

        {/* Content */}
        <div className="border border-line border-t-0 rounded-b-sm p-4">
          {assetView === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleAssets.map((asset) => (
                <div
                  key={asset._id}
                  className="relative bg-panel border border-line rounded-sm p-4"
                >
                  {/* Edit/Delete icons — Edit for admin+superadmin, Delete superadmin only */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => setEditingAsset(asset)}
                      title="Edit asset"
                      className="w-6 h-6 flex items-center justify-center rounded-sm text-white bg-[#1d5a8a] hover:!bg-[#16496d] text-xs"
                    >
                      ✎
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDelete(asset)}
                        title="Delete asset"
                        className="w-6 h-6 flex items-center justify-center rounded-sm bg-critical text-white hover:!bg-[#7d2715] text-xs"
                      >
                        🗑
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold m-0 mb-1 pr-14">
                    {asset.name}
                  </h3>
                  <p className="text-xs text-muted font-mono m-0">
                    {asset.assetCode} — {asset.location}
                  </p>
                  <span
                    className={`inline-block mt-2 mb-1 px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${
                      asset.status === "Operational"
                        ? "text-success border-success"
                        : asset.status === "Issue Reported"
                          ? "text-hazard border-hazard"
                          : asset.status === "Under Inspection" ||
                              asset.status === "Under Maintenance"
                            ? "text-[#1d5a8a] border-[#1d5a8a]"
                            : "text-critical border-critical"
                    }`}
                  >
                    {asset.status}
                  </span>

                  <div className="flex gap-3 mt-2 mb-1">
                    {asset.imageUrl && (
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="w-24 h-24 object-cover rounded-sm border border-line flex-shrink-0"
                      />
                    )}
                    {asset.qrUrl && (
                      <img
                        src={asset.qrUrl}
                        alt="QR code"
                        width="90"
                        className="flex-shrink-0"
                      />
                    )}
                  </div>

                  
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <a
                      href={`/asset/${asset.assetCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="self-center font-mono text-[11px] uppercase tracking-tag text-brand"
                    >
                      View Details
                    </a>
                    {/* <button
                      onClick={() =>
                        navigator.clipboard.writeText(`${window.location.origin}/asset/${asset.assetCode}`)
                      }
                      className="bg-green-500 hover:bg-green-600 text-white font-mono text-[10px] px-2.5 py-1.5 rounded-sm"
                    >
                      Copy Link
                    </button> */}

                    <button
                      onClick={() => generateAssetPoster(asset)}
                      className="bg-success hover:!bg-hazard text-white font-mono text-[10px] px-2.5 py-1.5 rounded-sm"
                    >
                      Poster 🡇
                    </button>
                  </div>
                </div>
              ))}
              {visibleAssets.length === 0 && (
                <p className="text-sm text-muted col-span-full">
                  No assets match these filters.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-ink text-white">
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                      Name
                    </th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                      Code
                    </th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                      Category
                    </th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                      Location
                    </th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                      Status
                    </th>
                    <th className="text-center px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAssets.map((asset) => (
                    <tr key={asset._id} className="border-b border-line">
                      <td className="px-4 py-2.5 text-sm">{asset.name}</td>
                      <td className="px-4 py-2.5 text-sm font-mono">
                        {asset.assetCode}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted">
                        {asset.category}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted">
                        {asset.location}
                      </td>
                      <td className="px-4 py-2.5 text-sm">{asset.status}</td>
                      <td className="px-4 py-2.5 text-sm">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/asset/${asset.assetCode}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[11px] uppercase tracking-tag text-brand"
                          >
                            Details
                          </a>

                          <button
                            onClick={() => generateAssetPoster(asset)}
                            className="bg-success hover:!bg-[#23613d] text-white font-mono text-[10px] px-0.5 py-0.5 rounded-sm"
                          >
                            Poster 🡇
                          </button>
                          <button
                            onClick={() => setEditingAsset(asset)}
                            title="Edit asset"
                            className="bg-[#1d5a8a] hover:!bg-[#16496d] w-6 h-6 flex items-center justify-center rounded-sm text-white text-xs"
                          >
                            ✎
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDelete(asset)}
                              title="Delete asset"
                              className="w-6 h-6 flex items-center justify-center rounded-sm bg-critical hover:!bg-[#7d2715] text-white  text-xs"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visibleAssets.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-sm text-muted text-center"
                      >
                        No assets match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {editingAsset && (
        <AssetEditModal
          asset={editingAsset}
          onSave={onUpdateAsset}
          onClose={() => setEditingAsset(null)}
        />
      )}
    </div>
  );
};

export default OverviewTab;
