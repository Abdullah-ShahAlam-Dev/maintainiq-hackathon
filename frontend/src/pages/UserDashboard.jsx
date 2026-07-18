import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getUser, logout } from "../utils/auth";
import { ASSET_CATEGORIES, OTHER_CATEGORY } from "../constants/categories";
import { generateAssetPoster } from "../utils/generateAssetPoster";

const STATUS_STYLES = {
  Reported: "text-hazard border-hazard",
  Resolved: "text-success border-success",
  Closed: "text-muted border-muted",
};

const STATUS_CLASS = {
  Operational: "text-success border-success",
  "Issue Reported": "text-hazard border-hazard",
  "Under Inspection": "text-[#1d5a8a] border-[#1d5a8a]",
  "Under Maintenance": "text-[#1d5a8a] border-[#1d5a8a]",
  "Out of Service": "text-critical border-critical",
  Retired: "text-critical border-critical",
};

const TABS = [
  { key: "assets", label: "Assets" },
  { key: "issues", label: "My Reported Issues" },
];

// ---- Assets tab — same UX as the public registry, just no OTP gate ----
const AssetsTab = () => {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("card");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/public/assets", { params: search ? { search } : {} })
      .then((res) => setAssets(res.data))
      .catch(() => setError("Failed to load assets"));
  }, [search]);

  const statuses = useMemo(
    () => [...new Set(assets.map((a) => a.status).filter(Boolean))],
    [assets],
  );

  const visibleAssets = useMemo(() => {
    let list = assets.filter(
      (a) =>
        (!categoryFilter ||
          (categoryFilter === OTHER_CATEGORY
            ? !ASSET_CATEGORIES.includes(a.category)
            : a.category === categoryFilter)) &&
        (!statusFilter || a.status === statusFilter),
    );
    if (sortBy === "name-desc")
      list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === "status")
      list = [...list].sort((a, b) => a.status.localeCompare(b.status));
    else list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [assets, categoryFilter, statusFilter, sortBy]);

  return (
    <div>
      {error && <p className="error-text mb-4">{error}</p>}

      <input
        placeholder="Search assets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 bg-panel border border-line rounded-sm px-4 py-3 mb-5">
        <div className="flex gap-2">
          <button
            onClick={() => setView("card")}
            className={`font-mono text-[11px] uppercase tracking-tag px-3 py-1.5 rounded-sm ${view === "card" ? "bg-brand text-white" : "bg-transparent text-ink border border-line"}`}
          >
            Card
          </button>
          <button
            onClick={() => setView("table")}
            className={`font-mono text-[11px] uppercase tracking-tag px-3 py-1.5 rounded-sm ${view === "table" ? "bg-brand text-white" : "bg-transparent text-ink border border-line"}`}
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
            {statuses.map((s) => (
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
        </div>
      </div>

      {view === "card" ? (
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
                className={`inline-block mt-2 mb-2 px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${STATUS_CLASS[asset.status] || "text-muted border-muted"}`}
              >
                {asset.status}
              </span>
              <div className="flex gap-3 mt-2 mb-2">
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
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  to={`/asset/${asset.assetCode}`}
                  className="font-mono text-[11px] uppercase tracking-tag text-brand"
                >
                  View Details
                </Link>
                <button
                  onClick={() => generateAssetPoster(asset)}
                  className="bg-success hover:!bg-hazard text-white font-mono text-[10px] px-2.5 py-1.5 rounded-sm"
                >
                  Poster 🡇
                </button>
              </div>
            </div>
          ))}
          {visibleAssets.length === 0 && !error && (
            <p className="text-sm text-muted col-span-full">
              No assets match these filters.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-panel border border-line rounded-sm overflow-hidden">
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
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                    View
                  </th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                    Poster
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
                    <td className="px-4 py-2.5 text-sm">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${STATUS_CLASS[asset.status] || "text-muted border-muted"}`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <Link
                        to={`/asset/${asset.assetCode}`}
                        className="font-mono text-[11px] uppercase tracking-tag text-brand"
                      >
                        Open →
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <button
                        onClick={() => generateAssetPoster(asset)}
                        className="bg-success hover:!bg-[#23613d] text-white font-mono text-[10px] px-2.5 py-1 rounded-sm"
                      >
                        Download🡇
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleAssets.length === 0 && !error && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-sm text-muted text-center"
                    >
                      No assets match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- My Reported Issues tab — with the latest technician maintenance note ----
const MyIssuesTab = ({ user }) => {
  const [issues, setIssues] = useState([]);
  const [latestNotes, setLatestNotes] = useState({}); // issueId -> { notes, technicianId }
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/issues", { params: { reporterEmail: user?.email } })
      .then(async (res) => {
        setIssues(res.data);
        // Fetch the latest maintenance note per issue (small lists at this scale)
        const entries = await Promise.all(
          res.data.map(async (issue) => {
            try {
              const recRes = await api.get(`/maintenance/issue/${issue._id}`);
              return [issue._id, recRes.data[0] || null]; // already sorted newest-first
            } catch {
              return [issue._id, null];
            }
          }),
        );
        setLatestNotes(Object.fromEntries(entries));
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load your issues"),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {error && <p className="error-text mb-4">{error}</p>}
      <div className="space-y-3">
        {issues.map((issue) => {
          const latest = latestNotes[issue._id];
          return (
            <div
              key={issue._id}
              className="bg-panel border border-line border-l-4 border-l-brand rounded-sm p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm m-0">
                  {issue.issueNumber} — {issue.title}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${STATUS_STYLES[issue.status] || "text-[#1d5a8a] border-[#1d5a8a]"}`}
                >
                  {issue.status}
                </span>
              </div>
              <p className="text-sm text-muted mt-1 mb-0">
                {issue.description}
              </p>
              <p className="text-xs font-mono text-muted mt-1 mb-0">
                {issue.assetId
                  ? `Asset: ${issue.assetId.name} (${issue.assetId.assetCode})`
                  : "Asset: Asset Removed"}
              </p>
              {latest && (
                <div className="mt-2 pt-2 border-t border-dashed border-line">
                  <p className="text-xs font-mono uppercase tracking-tag text-brand m-0 mb-1">
                    Latest from {latest.technicianId?.name || "technician"}
                  </p>
                  <p className="text-sm text-ink m-0">{latest.notes}</p>
                </div>
              )}
            </div>
          );
        })}
        {issues.length === 0 && !error && (
          <p className="text-sm text-muted">
            You haven't reported any issues yet.
          </p>
        )}
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState("assets");
  const navigate = useNavigate();
  const user = getUser();

  return (
    <div className="min-h-screen bg-base font-sans text-ink">
      <header className="bg-ink text-white border-b-[5px] border-hazard">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-mono text-sm uppercase tracking-tag m-0">
            MaintainIQ / My Account
          </h1>
          <div className="flex items-center gap-4 font-mono text-sm">
            <span>USER {user?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="bg-transparent border border-white/30 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-tag px-3 py-1.5 rounded-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <nav className="max-w-4xl mx-auto px-6 flex gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`group relative whitespace-nowrap font-mono text-xs uppercase tracking-tag px-5 py-3 rounded-t-sm border border-b-0 transition-colors ${
                  isActive
                    ? "bg-base text-ink border-line"
                    : "bg-transparent text-white/60 border-transparent hover:text-white"
                }`}
              >
                {isActive && (
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-hazard" />
                )}
                {!isActive && (
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <span className="mt-1 block">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === "assets" && <AssetsTab />}
        {activeTab === "issues" && <MyIssuesTab user={user} />}
      </main>
    </div>
  );
};

export default UserDashboard;
