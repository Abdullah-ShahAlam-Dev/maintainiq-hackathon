import { useState } from 'react';

// columns: array of { key, label } rendered before the Actions column.
// Each row object must have _id, name, email, status, approvedBy, createdAt,
// plus whatever extra fields the columns reference (e.g. specialty).
const ManagementTable = ({ title, columns, rows, onStatusChange, onDelete }) => {
  const [busyId, setBusyId] = useState(null);

  const handleStatus = async (id, status) => {
    setBusyId(id);
    try {
      await onStatusChange(id, status);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this account permanently? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await onDelete(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="bg-panel border border-line rounded-sm overflow-hidden">
      <div className="border-b border-line px-5 py-3">
        <h2 className="font-mono text-xs uppercase tracking-tag text-muted m-0 border-b-0">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-ink text-white">
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Name</th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Email</th>
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">
                  {col.label}
                </th>
              ))}
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Created At</th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Updated By</th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-tag">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isRevoked = row.status === 'revoked';
              return (
                <tr key={row._id} className="border-b border-line">
                  <td className="px-4 py-2.5 text-sm">{row.name}</td>
                  <td className="px-4 py-2.5 text-sm font-mono">{row.email}</td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2.5 text-sm">
                      {row[col.key] || '—'}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-sm font-mono text-muted">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-sm">{row.approvedBy || '—'}</td>
                  <td className="px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <select
                        value={row.status}
                        disabled={busyId === row._id}
                        onChange={(e) => handleStatus(row._id, e.target.value)}
                        className="border border-line rounded-sm px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-brand"
                      >
                        <option value="approved">Granted</option>
                        <option value="revoked">Revoked</option>
                      </select>
                      <button
                        onClick={() => handleDelete(row._id)}
                        disabled={!isRevoked || busyId === row._id}
                        className="bg-critical hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono text-[10px] font-semibold uppercase tracking-tag px-2.5 py-1.5 rounded-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4 + columns.length} className="px-4 py-6 text-sm text-muted text-center">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ManagementTable;
