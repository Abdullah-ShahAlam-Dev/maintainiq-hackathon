import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import api from "../../api/axios";
import { ASSET_CATEGORIES, OTHER_CATEGORY } from "../../constants/categories";

const PRIORITY_STYLES = {
  Critical: "text-critical border-critical",
  High: "text-hazard border-hazard",
  Medium: "text-[#1d5a8a] border-[#1d5a8a]",
  Low: "text-muted border-muted",
};

// Generates a full Issue History Report (not just an asset QR poster) —
// reporter info, asset snapshot, assignment trail, full timeline, and every
// maintenance note ever logged against this issue. Admin-only, since
// technicians/users never see this tab at all.
const handleDownloadReport = async (issue) => {
  const asset = issue.assetId; // may be null if the asset has since been deleted

  let maintenanceRecords = [];
  let historyEntries = [];
  try {
    const [maintRes, histRes] = await Promise.all([
      api.get(`/maintenance/issue/${issue._id}`),
      api.get(`/history/issue/${issue._id}`),
    ]);
    maintenanceRecords = maintRes.data;
    historyEntries = histRes.data;
  } catch (err) {
    console.error("Failed to fetch report data:", err);
  }

  // Cloudinary image URLs aren't data URIs like the QR code is, so jsPDF
  // can't embed them directly — fetch + convert to base64 first.
  let assetImageDataUrl = null;
  if (asset?.imageUrl) {
    try {
      const imgRes = await fetch(asset.imageUrl);
      const blob = await imgRes.blob();
      assetImageDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Failed to load asset image for report:", err);
    }
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const marginX = 15;
  const maxY = 280;
  let y = 20;

  const ensureSpace = (linesNeeded = 1) => {
    if (y + linesNeeded * 6 > maxY) {
      doc.addPage();
      y = 20;
    }
  };

  const sectionHeader = (title) => {
    ensureSpace(2);
    doc.setFillColor(20, 24, 31);
    doc.rect(marginX, y - 5, pageWidth - marginX * 2, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.text(title.toUpperCase(), marginX + 3, y);
    y += 9;
    doc.setTextColor(20, 24, 31);
  };

  const line = (label, value) => {
    ensureSpace();
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(107, 117, 112);
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 24, 31);
    doc.text(String(value ?? "—"), marginX + 40, y);
    y += 6;
  };

  const wrappedText = (text, indent = 0) => {
    const usableWidth = pageWidth - marginX * 2 - indent;
    const split = doc.splitTextToSize(text || "—", usableWidth);
    split.forEach((s) => {
      ensureSpace();
      doc.text(s, marginX + indent, y);
      y += 5;
    });
  };

  // ALgom for justify Text
  const justifyText = (lines, x, y, maxWidth, lineHeight = 5) => {
    lines.forEach((line, index) => {
      // Last line left align
      if (index === lines.length - 1) {
        doc.text(line, x, y);
        y += lineHeight;
        return;
      }

      const words = line.trim().split(/\s+/);

      // Agar sirf 1 word hai
      if (words.length === 1) {
        doc.text(line, x, y);
        y += lineHeight;
        return;
      }

      const lineWidth = doc.getTextWidth(line);
      const extraSpace = (maxWidth - lineWidth) / (words.length - 1);

      let currentX = x;

      words.forEach((word) => {
        doc.text(word, currentX, y);
        currentX += doc.getTextWidth(word) + doc.getTextWidth(" ") + extraSpace;
      });

      y += lineHeight;
    });

    return y;
  };

  // ---- Header band ----
  doc.setFillColor(20, 24, 31);
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.setFillColor(217, 114, 15);
  doc.rect(0, 24, pageWidth, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("courier", "bold");
  doc.setFontSize(18);
  doc.text("MAINTAINIQ", marginX, 15);
  doc.setFontSize(9);
  doc.setFont("courier", "normal");
  doc.text("ISSUE HISTORY REPORT", pageWidth - marginX, 15, { align: "right" });
  y = 35;

  // Asset photo, top-right — same visual slot as the empty space next to Issue Details
  // ---- Issue info ----
  // ---- Issue Details (with fixed-size, top-aligned asset image) ----
  sectionHeader("Issue Details");
  const sectionTopY = y; // top of the left-column text AND top of the image box

  const hasImage = Boolean(assetImageDataUrl);
  const imageBoxWidth = 48;
  const imageBoxHeight = 48; // FIXED — never stretches with content length
  const imageBoxY = sectionTopY - 2.5; // small offset so box top visually aligns with text cap-height
  const leftColWidth = hasImage
    ? pageWidth - marginX * 2 - imageBoxWidth - 6
    : pageWidth - marginX * 2;

  if (hasImage) {
    const imgX = pageWidth - marginX - imageBoxWidth;
    doc.setDrawColor(215, 221, 212);
    doc.setLineWidth(0.4);
    doc.rect(imgX, imageBoxY, imageBoxWidth, imageBoxHeight);
    doc.addImage(
      assetImageDataUrl,
      imgX,
      imageBoxY,
      imageBoxWidth,
      imageBoxHeight,
      undefined,
      "FAST",
    );
  }

  const fieldLine = (label, value) => {
    ensureSpace();
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(107, 117, 112);
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 24, 31);
    const text = String(value ?? "—");
    const wrapped = doc.splitTextToSize(text, leftColWidth - 40);
    doc.text(wrapped, marginX + 40, y);
    y += wrapped.length * 5;
  };

  fieldLine("Issue #:", issue.issueNumber);
  fieldLine("Title:", issue.title);
  fieldLine("Category:", issue.category);
  fieldLine("Priority:", issue.priority);
  fieldLine("Status:", issue.status);
  fieldLine(
    "Reported:",
    issue.createdAt ? new Date(issue.createdAt).toLocaleString() : "—",
  );

  ensureSpace();
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(107, 117, 112);
  doc.text("Description:", marginX, y);
  // For description value text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(20, 24, 31);
  const descWrapped = doc.splitTextToSize(
    issue.description || "—",
    leftColWidth - 40,
  );

  // descWrapped.forEach((line) => {
  //   ensureSpace();
  //   doc.text(line, marginX + 40, y);
  //   y += 5;
  // });
  y = justifyText(descWrapped, marginX + 40, y, leftColWidth - 40);

  // Next section must clear BOTH the text and the fixed image box
  if (hasImage) {
    y = Math.max(y, imageBoxY + imageBoxHeight + 2.5); //2.5 add for inital cutooff for iamge push toward down
  }
  y += 5.5;
  
// CLOSING HEADER IMAGE + DETAIL SECTION

  // ---- Asset snapshot ----
  sectionHeader("Asset");
  if (asset) {
    line("Name:", asset.name);
    line("Code:", asset.assetCode);
    line("Category:", asset.category);
    line("Location:", asset.location);
  } else {
    ensureSpace();
    doc.setFont("courier", "bold");
    doc.setTextColor(168, 55, 28);
    doc.text("This asset has been removed from the registry.", marginX, y);
    doc.setTextColor(20, 24, 31);
    y += 6;
  }
  y += 3;

  // ---- Reporter ----
  sectionHeader("Reporter");
  line("Name:", issue.reporterInfo?.name);
  line("Email:", issue.reporterInfo?.email);
  if (issue.reporterInfo?.phone) line("Phone:", issue.reporterInfo.phone);
  line("AI Suggested:", issue.aiSuggested ? "Yes" : "No");
  if (issue.aiSuggested) line("AI Edited:", issue.aiEdited ? "Yes" : "No");
  y += 3;

  // ---- Assignment ----
  sectionHeader("Assignment");
  line(
    "Assigned Technician:",
    issue.assignedTechnician
      ? `${issue.assignedTechnician.name} (${issue.assignedTechnician.email})`
      : "Not yet assigned",
  );
  line("Assigned By:", issue.assignedBy || "—");
  y += 3;

  // ---- Timeline ----
  sectionHeader("Timeline");
  if (historyEntries.length === 0) {
    ensureSpace();
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(107, 117, 112);
    doc.text("No timeline entries recorded.", marginX, y);
    y += 6;
  } else {
    historyEntries.forEach((entry) => {
      ensureSpace();
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(107, 117, 112);
      doc.text(new Date(entry.createdAt).toLocaleString(), marginX, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(20, 24, 31);
      doc.setFontSize(9);
      doc.text(`${entry.actor} — ${entry.action}`, marginX + 42, y);
      y += 6;
    });
  }
  y += 3;

  // ---- Maintenance records ----
  sectionHeader("Maintenance Records");
  if (maintenanceRecords.length === 0) {
    ensureSpace();
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(107, 117, 112);
    doc.text("No maintenance notes logged yet.", marginX, y);
    y += 6;
  } else {
    maintenanceRecords.forEach((rec, i) => {
      ensureSpace(2);
      doc.setFont("courier", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 92, 82);
      doc.text(
        `#${i + 1} — ${rec.technicianId?.name || "Unknown"} — ${new Date(rec.date || rec.createdAt).toLocaleDateString()}`,
        marginX,
        y,
      );
      y += 6;
      doc.setTextColor(20, 24, 31);
      wrappedText(rec.notes, 3);
      line("   Cost:", `Rs. ${rec.cost}`);
      line("   Time Spent:", `${rec.timeSpent} min`);
      line("   Final Condition:", rec.finalCondition);
      y += 2;
    });
  }

  // ---- Footer on every page ----
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(215, 221, 212);
    doc.setLineWidth(0.3);
    doc.line(marginX, 290, pageWidth - marginX, 290);
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(107, 117, 112);
    doc.text(`Generated ${new Date().toLocaleString()}`, marginX, 294);
    doc.text(`Page ${p} of ${pageCount}`, pageWidth - marginX, 294, {
      align: "right",
    });
  }

  doc.save(`issue-report-${issue.issueNumber}.pdf`);
}; // Histrory report closing

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
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "__ASSET_REMOVED__"
        ? !i.assetId
        : i.status === statusFilter);
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
      className="w-40 truncate center border border-line rounded-sm px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-brand disabled:opacity-40 disabled:cursor-not-allowed"
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
                : "bg-transparent text-ink border border-line hover:text-white"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setView("card")}
            className={`font-mono text-[11px] uppercase tracking-tag px-3 py-1.5 rounded-sm ${
              view === "card"
                ? "bg-brand text-white"
                : "bg-transparent text-ink border border-line hover:text-white"
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
                    History Report
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
                      {!issue.assetId &&  (
                        <div className="whitespace-nowrap text-[9px] font-mono font-bold uppercase tracking-tag text-critical">
                          (Asset Removed)
                        </div>
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
                        onClick={() => handleDownloadReport(issue)}
                        className="bg-success hover:!bg-[#23613d] text-white font-mono text-[10px] px-2.5 py-1 rounded-sm"
                      >
                        Download🡇
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
              className="bg-panel border border-line border-l-4 border-l-hazard rounded-sm p-4 flex flex-col h-full"
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
                onClick={() => handleDownloadReport(issue)}
                className="mt-auto w-full bg-success hover:!bg-hazard text-white font-mono text-[10px] px-2.5 py-1.5 rounded-sm"
              >
                Download 🡇
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
