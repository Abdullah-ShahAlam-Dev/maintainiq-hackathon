import { useEffect, useState } from "react";
import api from "../../api/axios";

const PendingRow = ({ person, onDecide, busy }) => (
  <div className="flex items-center justify-between gap-4 border border-line rounded-sm bg-panel px-4 py-3">
    <div className="min-w-0">
      <p className="text-sm font-semibold m-0 truncate">{person.name}</p>
      <p className="text-xs text-muted font-mono m-0 truncate">
        {person.email}
      </p>
      {person.specialty && (
        <p className="text-xs text-muted mt-0.5 mb-0">
          Specialty: {person.specialty}
        </p>
      )}

      {person.createdAt && (
        <p className="text-xs text-muted mt-0.5 mb-0 font-mono">
          Applied: {new Date(person.createdAt).toLocaleDateString()}{" "}
          {new Date(person.createdAt).toLocaleTimeString()}
        </p>
      )}

      {person.profilePic && (
        <a
          href={person.profilePic}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold font-mono text-brand uppercase tracking-tag"
        >
          View Evidence ➡
        </a>
      )}
    </div>
    <div className="flex gap-2 shrink-0">
      <button
        disabled={busy}
        onClick={() => onDecide(person._id, "approved")}
        className="bg-success hover:opacity-90 text-white font-mono text-[10px] font-semibold uppercase tracking-tag px-3 py-1.5 rounded-sm"
      >
        Approve
      </button>
      <button
        disabled={busy}
        onClick={() => onDecide(person._id, "revoked")}
        className="bg-critical hover:opacity-90 text-white font-mono text-[10px] font-semibold uppercase tracking-tag px-3 py-1.5 rounded-sm"
      >
        Reject
      </button>
    </div>
  </div>
);

const ApprovalCard = ({
  title,
  subtitle,
  people,
  onDecide,
  busyId,
  emptyLabel,
}) => (
  <section className="bg-panel border border-line rounded-sm overflow-hidden">
    <div className="bg-ink px-5 py-3 border-b-[5px] border-hazard">
      <h2 className="font-mono text-xs uppercase tracking-tag text-white m-0 border-b-0">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-white/60 mt-1 mb-0">{subtitle}</p>
      )}
    </div>
    <div className="p-5 space-y-2">
      {people.length === 0 && (
        <p className="text-sm text-muted italic">{emptyLabel}</p>
      )}
      {people.map((p) => (
        <PendingRow
          key={p._id}
          person={p}
          onDecide={onDecide}
          busy={busyId === p._id}
        />
      ))}
    </div>
  </section>
);

const ApprovalsTab = ({ isSuperAdmin }) => {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [pendingTechnicians, setPendingTechnicians] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadPending = async () => {
    try {
      const requests = [
        api.get("/auth/pending", { params: { role: "technician" } }),
      ];
      if (isSuperAdmin)
        requests.push(api.get("/auth/pending", { params: { role: "admin" } }));

      const results = await Promise.all(requests);
      setPendingTechnicians(results[0].data);
      if (isSuperAdmin) setPendingAdmins(results[1].data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load pending approvals",
      );
    }
  };

  useEffect(() => {
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  const handleDecide = async (userId, status) => {
    setBusyId(userId);
    setError("");
    try {
      await api.put(`/auth/${userId}/status`, { status });
      await loadPending();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update this account");
    } finally {
      setBusyId(null);
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
          onDecide={handleDecide}
          busyId={busyId}
          emptyLabel="No admin signups waiting for review."
        />
      )}

      <ApprovalCard
        title="Pending Technician Approvals"
        subtitle="Review the certification/evidence document before granting access."
        people={pendingTechnicians}
        onDecide={handleDecide}
        busyId={busyId}
        emptyLabel="No technician signups waiting for review."
      />
    </div>
  );
};

export default ApprovalsTab;
