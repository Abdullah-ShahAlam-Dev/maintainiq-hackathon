const PRIORITY_STYLES = {
  Critical: 'text-critical border-critical',
  High: 'text-hazard border-hazard',
  Medium: 'text-[#1d5a8a] border-[#1d5a8a]',
  Low: 'text-muted border-muted',
};

const IssueManagementTab = ({ issues, technicians, onAssign }) => {
  return (
    <section className="bg-panel border border-line rounded-sm overflow-hidden">
      <div className="border-b border-line px-5 py-3 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-tag text-muted m-0 border-b-0">
          Issue Management
        </h2>
        <span className="font-mono text-[11px] text-muted">{issues.length} total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-ink text-white">
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Issue #</th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Title</th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Priority</th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Status</th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Assign Technician</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr
                key={issue._id}
                className={`border-b border-line ${
                  issue.priority === 'Critical' ? 'bg-critical/5' : ''
                }`}
              >
                <td className="px-4 py-2.5 text-sm font-mono">{issue.issueNumber}</td>
                <td className="px-4 py-2.5 text-sm">{issue.title}</td>
                <td className="px-4 py-2.5 text-sm">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-tag ${
                      PRIORITY_STYLES[issue.priority] || 'text-muted border-muted'
                    }`}
                  >
                    {issue.priority}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm">{issue.status}</td>
                <td className="px-4 py-2.5 text-sm">
                  <select
                    defaultValue={issue.assignedTechnician?._id || ''}
                    onChange={(e) => onAssign(issue._id, e.target.value)}
                    className="border border-line rounded-sm px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-brand"
                  >
                    <option value="">-- assign --</option>
                    {technicians.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-muted text-center">
                  No issues reported yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default IssueManagementTab;
