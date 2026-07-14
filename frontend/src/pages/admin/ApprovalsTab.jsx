import { useEffect, useState } from 'react';
import api from '../../api/axios';

// ---------------------------------------------------------------------------
// BACKEND TODO — none of this exists on the server yet. Once it does, wire up:
//   GET  /api/auth/pending?role=admin        -> pending admin signups (super admin only)
//   GET  /api/auth/pending?role=technician   -> pending technician signups (admin)
//   PUT  /api/auth/:id/approve               -> approve a user
//   PUT  /api/auth/:id/reject                -> reject a user
// The User model also needs a `status: 'pending' | 'approved' | 'rejected'` field,
// and technician signups need a `verificationDocUrl` (Cloudinary) field.
// Until then this tab renders empty-state UI so the layout/UX is ready to wire up.
// ---------------------------------------------------------------------------

const PendingRow = ({ person, onApprove, onReject }) => (
  <div className="flex items-center justify-between gap-4 border border-line rounded-sm bg-panel px-4 py-3">
    <div className="min-w-0">
      <p className="text-sm font-semibold m-0 truncate">{person.name}</p>
      <p className="text-xs text-muted font-mono m-0 truncate">{person.email}</p>
      {person.verificationDocUrl && (
        <a
          href={person.verificationDocUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-mono text-brand uppercase tracking-tag"
        >
          View verification doc
        </a>
      )}
    </div>
    <div className="flex gap-2 shrink-0">
      <button
        onClick={() => onApprove(person._id)}
        className="bg-success hover:opacity-90 text-white font-mono text-[10px] font-semibold uppercase tracking-tag px-3 py-1.5 rounded-sm"
      >
        Approve
      </button>
      <button
        onClick={() => onReject(person._id)}
        className="bg-critical hover:opacity-90 text-white font-mono text-[10px] font-semibold uppercase tracking-tag px-3 py-1.5 rounded-sm"
      >
        Reject
      </button>
    </div>
  </div>
);

const ApprovalCard = ({ title, subtitle, people, onApprove, onReject, emptyLabel }) => (
  <section className="bg-panel border border-line rounded-sm">
    <div className="border-b border-line px-5 py-3">
      <h2 className="font-mono text-xs uppercase tracking-tag text-muted m-0 border-b-0">{title}</h2>
      {subtitle && <p className="text-xs text-muted mt-1 mb-0">{subtitle}</p>}
    </div>
    <div className="p-5 space-y-2">
      {people.length === 0 && (
        <p className="text-sm text-muted italic">{emptyLabel}</p>
      )}
      {people.map((p) => (
        <PendingRow key={p._id} person={p} onApprove={onApprove} onReject={onReject} />
      ))}
    </div>
  </section>
);

const ApprovalsTab = ({ isSuperAdmin }) => {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [pendingTechnicians, setPendingTechnicians] = useState([]);
  const [error, setError] = useState('');

  const loadPending = async () => {
    try {
      // Real calls once the backend supports them:
      // if (isSuperAdmin) {
      //   const adminsRes = await api.get('/auth/pending', { params: { role: 'admin' } });
      //   setPendingAdmins(adminsRes.data);
      // }
      // const techRes = await api.get('/auth/pending', { params: { role: 'technician' } });
      // setPendingTechnicians(techRes.data);

      setPendingAdmins([]);
      setPendingTechnicians([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending approvals');
    }
  };

  useEffect(() => {
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (userId) => {
    try {
      // await api.put(`/auth/${userId}/approve`);
      loadPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    try {
      // await api.put(`/auth/${userId}/reject`);
      loadPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject user');
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="error-text">{error}</p>}

      {isSuperAdmin && (
        <ApprovalCard
          title="Pending Admin Signups"
          subtitle="Super Admin only — approve new Admin accounts before they can log in."
          people={pendingAdmins}
          onApprove={handleApprove}
          onReject={handleReject}
          emptyLabel="No admin signups waiting for review."
        />
      )}

      <ApprovalCard
        title="Pending Technician Approvals"
        subtitle="Review uploaded verification documents before granting technician access."
        people={pendingTechnicians}
        onApprove={handleApprove}
        onReject={handleReject}
        emptyLabel="No technician signups waiting for review."
      />
    </div>
  );
};

export default ApprovalsTab;
