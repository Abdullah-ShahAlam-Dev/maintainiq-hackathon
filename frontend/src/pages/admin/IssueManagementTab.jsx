import { useMemo, useState } from 'react';

const PRIORITY_STYLES = {
  Critical: 'text-critical border-critical',
  High: 'text-hazard border-hazard',
  Medium: 'text-[#1d5a8a] border-[#1d5a8a]',
  Low: 'text-muted border-muted',
};

const handleDownloadLabel = (issue) => {
  // Placeholder — wire up to a real PDF/label generator later.
  console.log('Download label for issue', issue.issueNumber);
};

const IssueManagementTab = ({ issues, technicians, onAssign }) => {
  const [view, setView] = useState('table'); // 'table' | 'card'
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const categories = useMemo(
    () => [...new Set(issues.map((i) => i.category).filter(Boolean))],
    [issues]
  );
  const statuses = useMemo(
    () => [...new Set(issues.map((i) => i.status).filter(Boolean))],
    [issues]
  );

  const filteredIssues = issues.filter(
    (i) =>
      (!statusFilter || i.status === statusFilter) &&
      (!categoryFilter || i.category === categoryFilter)
  );

  const AssignSelect = ({ issue }) => (
    <select
      defaultValue={issue.assignedTechnician?._id || ''}
      onChange={(e) => onAssign(issue._id, e.target.value)}
      className="border border-line rounded-sm px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-brand"
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
            onClick={() => setView('table')}
            className={`font-mono text-[11px] uppercase tracking-tag px-3 py-1.5 rounded-sm ${
              view === 'table' ? 'bg-brand text-white' : 'bg-transparent text-ink border border-line'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setView('card')}
            className={`font-mono text-[11px] uppercase tracking-tag px-3 py-1.5 rounded-sm ${
              view === 'card' ? 'bg-brand text-white' : 'bg-transparent text-ink border border-line'
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
        </div>
      </div>

      {view === 'table' ? (
        <div className="bg-panel border border-line rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-ink text-white">
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Issue #</th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Title</th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Priority</th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Status</th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Assign Technician</th>
                  <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Label</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr key={issue._id} className={`border-b border-line ${issue.priority === 'Critical' ? 'bg-critical/5' : ''}`}>
                    <td className="px-4 py-2.5 text-sm font-mono">{issue.issueNumber}</td>
                    <td className="px-4 py-2.5 text-sm">{issue.title}</td>
                    <td className="px-4 py-2.5 text-sm">
                      <span className={`inline-block px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${PRIORITY_STYLES[issue.priority] || 'text-muted border-muted'}`}>
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">{issue.status}</td>
                    <td className="px-4 py-2.5 text-sm"><AssignSelect issue={issue} /></td>
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
                {filteredIssues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-sm text-muted text-center">No issues match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIssues.map((issue) => (
            <div key={issue._id} className="bg-panel border border-line border-l-4 border-l-hazard rounded-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-mono text-sm m-0">{issue.issueNumber}</h3>
                <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${PRIORITY_STYLES[issue.priority] || 'text-muted border-muted'}`}>
                  {issue.priority}
                </span>
              </div>
              <p className="text-sm font-semibold m-0 mb-1">{issue.title}</p>
              <p className="text-xs text-muted m-0 mb-2">{issue.status} • {issue.category}</p>
              <AssignSelect issue={issue} />
              <button
                onClick={() => handleDownloadLabel(issue)}
                className="mt-2 w-full bg-ink hover:bg-black text-white font-mono text-[10px] px-2.5 py-1.5 rounded-sm"
              >
                Download Label
              </button>
            </div>
          ))}
          {filteredIssues.length === 0 && (
            <p className="text-sm text-muted col-span-full">No issues match these filters.</p>
          )}
        </div>
      )}
    </section>
  );
};

export default IssueManagementTab;
