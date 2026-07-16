import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { ASSET_CATEGORIES, OTHER_CATEGORY } from "../../constants/categories";

const PRIORITY_STYLES = {
  Critical: "text-critical border-critical",
  High: "text-hazard border-hazard",
  Medium: "text-[#1d5a8a] border-[#1d5a8a]",
  Low: "text-muted border-muted",
};

const handleDownloadLabel = (issue) => {
  const asset = issue.assetId; // may be null if the asset has since been deleted

  // A5 portrait — a proper notice-board poster, not a tiny sticker
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const pageWidth = 148;
  const centerX = pageWidth / 2;

  // ---- Header band ----
  doc.setFillColor(20, 24, 31); // --ink
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFillColor(217, 114, 15); // --hazard accent strip
  doc.rect(0, 28, pageWidth, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("courier", "bold");
  doc.setFontSize(22);
  doc.text("MAINTAINIQ", centerX, 15, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.text("ASSET IDENTIFICATION LABEL", centerX, 22, { align: "center" });

  // ---- Asset name ----
  doc.setTextColor(20, 24, 31);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(
    asset ? asset.name || "Unnamed Asset" : "Asset Removed",
    centerX,
    45,
    { align: "center" },
  );

  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 117, 112); // --muted
  doc.text(
    asset
      ? `${asset.assetCode || "—"}  •  ${asset.category || "—"}`
      : "This asset no longer exists in the registry",
    centerX,
    53,
    { align: "center" },
  );
  if (asset) {
    doc.text(asset.location || "—", centerX, 59, { align: "center" });
  }

  // ---- QR code, centered and prominent (skipped if asset/QR unavailable) ----
  const qrSize = 70;
  const qrX = centerX - qrSize / 2;
  const qrY = 68;

  if (asset?.qrUrl) {
    doc.setDrawColor(215, 221, 212); // --border
    doc.setLineWidth(0.6);
    doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8); // frame around QR
    doc.addImage(asset.qrUrl, "PNG", qrX, qrY, qrSize, qrSize);
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 92, 82); // --brand
    doc.text(
      "SCAN TO VIEW STATUS & REPORT AN ISSUE",
      centerX,
      qrY + qrSize + 12,
      { align: "center" },
    );
  } else {
    doc.setDrawColor(168, 55, 28); // --critical
    doc.setLineWidth(0.6);
    doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.setTextColor(168, 55, 28);
    doc.text("QR UNAVAILABLE —", centerX, qrY + qrSize / 2 - 4, {
      align: "center",
    });
    doc.text("ASSET REMOVED", centerX, qrY + qrSize / 2 + 4, {
      align: "center",
    });
  }

  // ---- Footer ----
  doc.setDrawColor(215, 221, 212);
  doc.setLineWidth(0.3);
  doc.line(10, 195, pageWidth - 10, 195);

  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(107, 117, 112);
  doc.text(`Issue Ref: ${issue.issueNumber}`, 10, 201);
  doc.text(new Date().toLocaleDateString(), pageWidth - 10, 201, {
    align: "right",
  });

  doc.save(`asset-label-${asset?.assetCode || issue.issueNumber}.pdf`);
};

const IssueManagementTab = ({ issues, technicians, onAssign }) => {
  const [view, setView] = useState("table"); // 'table' | 'card'
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const statuses = useMemo(
    () => [...new Set(issues.map((i) => i.status).filter(Boolean))],
    [issues],
  );

  const filteredIssues = issues.filter((i) => {
    const matchesStatus = !statusFilter || (statusFilter === "__ASSET_REMOVED__" ? !i.assetId: i.status === statusFilter);
    const matchesCategory =
      !categoryFilter ||
      (categoryFilter === OTHER_CATEGORY
        ? !ASSET_CATEGORIES.includes(i.category)
        : i.category === categoryFilter);
    return matchesStatus && matchesCategory;
  });

  // Sort by NEwest
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === "priority") {
      const order = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return (order[b.priority] || 0) - (order[a.priority] || 0);
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return new Date(b.createdAt) - new Date(a.createdAt); // 'newest' (default)
  });

  const AssignSelect = ({ issue }) => (
    <select
      defaultValue={issue.assignedTechnician?._id || ""}
      onChange={(e) => onAssign(issue._id, e.target.value)}
      disabled={!issue.assetId}
      title={
        !issue.assetId ? "Cannot assign — asset no longer exists" : undefined
      }
      className="border border-line rounded-sm px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-brand disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <option value="">-- assign --</option>
      {technicians.map((t) => (
        <option key={t._id} value={t._id}>
          {t.name} ({t.email})
        </option>
      ))}
    </select>
  );

  return (
    <section className="space-y-4">
      {/* Toolbar: view toggle + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-panel border border-line rounded-sm px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setView("table")}
            className={`font-mono text-[11px] uppercase tracking-tag px-3 py-1.5 rounded-sm ${
              view === "table"
                ? "bg-brand text-white"
                : "bg-transparent text-ink border border-line"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setView("card")}
            className={`font-mono text-[11px] uppercase tracking-tag px-3 py-1.5 rounded-sm ${
              view === "card"
                ? "bg-brand text-white"
                : "bg-transparent text-ink border border-line"
            }`}
          >
            Card
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

            <option value="__ASSET_REMOVED__">Asset Removed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-line rounded-sm px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-brand"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority (Critical First)</option>
          </select>
        </div>
      </div>

      {view === "table" ? (
        <div className="bg-panel border border-line rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-ink text-white">
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                    Issue #
                  </th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                    Title
                  </th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                    Asset Category
                  </th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                    Priority
                  </th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                    Status
                  </th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                    Assigned Technician
                  </th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                    Assigned By
                  </th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                    Label
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedIssues.map((issue) => (
                  <tr
                    key={issue._id}
                    className={`border-b border-line ${issue.priority === "Critical" ? "bg-critical/5" : ""}`}
                  >
                    <td className="px-4 py-2.5 text-sm font-mono">
                      {issue.issueNumber}
                    </td>
                    <td className="px-4 py-2.5 text-sm">{issue.title}</td>
                    <td className="px-4 py-2.5 text-sm text-muted">
                      {issue.category}
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${PRIORITY_STYLES[issue.priority] || "text-muted border-muted"}`}
                      >
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      {issue.status}
                      {!issue.assetId && (
                        <span className="ml-2 text-[9px] font-mono font-bold uppercase tracking-tag text-critical">
                          (Asset Removed)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <AssignSelect issue={issue} />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted">
                      {issue.assignedBy || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <button
                        onClick={() => handleDownloadLabel(issue)}
                        className="bg-ink hover:bg-black text-white font-mono text-[10px] px-2.5 py-1.5 rounded-sm"
                      >
                        Download Label
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedIssues.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-sm text-muted text-center"
                    >
                      No issues match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedIssues.map((issue) => (
            <div
              key={issue._id}
              className="bg-panel border border-line border-l-4 border-l-hazard rounded-sm p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-mono text-sm m-0">{issue.issueNumber}</h3>
                <span
                  className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${PRIORITY_STYLES[issue.priority] || "text-muted border-muted"}`}
                >
                  {issue.priority}
                </span>
              </div>
              <p className="text-sm font-semibold m-0 mb-1">{issue.title}</p>
              <p className="text-xs text-muted m-0 mb-2">
                {issue.status} • {issue.category}
                {!issue.assetId && (
                  <span className="ml-1 text-[9px] font-mono font-bold uppercase tracking-tag text-critical">
                    (Asset Removed)
                  </span>
                )}
              </p>
              <AssignSelect issue={issue} />
              {issue.assignedBy && (
                <p className="text-xs text-muted mt-1 mb-0">
                  Assigned by: {issue.assignedBy}
                </p>
              )}
              <button
                onClick={() => handleDownloadLabel(issue)}
                className="mt-2 w-full bg-ink hover:bg-black text-white font-mono text-[10px] px-2.5 py-1.5 rounded-sm"
              >
                Download Label
              </button>
            </div>
          ))}
          {sortedIssues.length === 0 && (
            <p className="text-sm text-muted col-span-full">
              No issues match these filters.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default IssueManagementTab;
