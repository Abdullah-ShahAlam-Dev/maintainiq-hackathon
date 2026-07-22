import { useEffect, useState } from "react";
import api from "../api/axios";
import { getUser, logout } from "../utils/auth";
import { useNavigate, Link } from "react-router-dom";
import OverviewTab from "./admin/OverviewTab";
import ApprovalsTab from "./admin/ApprovalsTab";
import IssueManagementTab from "./admin/IssueManagementTab";
import AdministratorsTab from "./admin/AdministratorsTab";
import TechniciansTab from "./admin/TechniciansTab";
import UsersTab from "./admin/UsersTab";

const AdminDashboard = () => {
  const user = getUser();
  const isSuperAdmin = user?.role === "superadmin";

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "approvals", label: "Approvals" },
    { key: "issues", label: "Issue Management" },
    ...(isSuperAdmin
      ? [{ key: "administrators", label: "Administrators" }]
      : []),
    { key: "technicians", label: "Technicians" },
    { key: "users", label: "Users" },
  ];

  const [activeTab, setActiveTab] = useState("overview");

  const [assetImage, setAssetImage] = useState(null);
  const [assets, setAssets] = useState([]);
  const [issues, setIssues] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [form, setForm] = useState({
    assetCode: "",
    name: "",
    category: "",
    location: "",
    condition: "Good",
  });
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [assetsRes, issuesRes, techRes] = await Promise.all([
        api.get("/assets", { params: search ? { search } : {} }),
        api.get("/issues"),
        api.get("/auth/technicians"),
      ]);
      setAssets(assetsRes.data);
      setIssues(issuesRes.data);
      setTechnicians(techRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        payload.append(key, value),
      );
      if (assetImage) payload.append("image", assetImage);

      await api.post("/assets", payload);
      setForm({
        assetCode: "",
        name: "",
        category: "",
        location: "",
        condition: "Good",
      });
      setAssetImage(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create asset");
    }
  };

  const handleAssign = async (issueId, technicianId) => {
    if (!technicianId) return;
    try {
      await api.put(`/issues/${issueId}/assign`, { technicianId });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign technician");
    }
  };

  const handleUpdateAsset = async (assetId, updates, imageFile) => {
    const payload = new FormData();
    Object.entries(updates).forEach(([key, value]) =>
      payload.append(key, value),
    );
    if (imageFile) payload.append("image", imageFile);
    await api.put(`/assets/${assetId}`, payload);
    loadData();
  };

  const handleDeleteAsset = async (assetId) => {
    await api.delete(`/assets/${assetId}`);
    loadData();
  };

  return (
    <div className="min-h-screen bg-base font-sans text-ink">
      <header className="bg-ink text-white border-b-[5px] border-hazard">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-mono text-base uppercase tracking-tag m-0">
            <Link
              to="/"
              className="text-inherit no-underline hover:opacity-90 transition"
            >
              MaintainIQ
            </Link>
            {" "}
            <span
              className="text-hazard font-sans font-black inline-block mx-1"
              style={{ WebkitTextStroke: "3px" }}
            >
              /
            </span>{" "}
            {isSuperAdmin ? "Super Admin" : "Administrator"}
          </h1>
          <div className="flex items-center gap-4 font-mono text-sm">
            <span>{user?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="bg-brand border border-white/30 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-tag px-6 py-3 rounded-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <nav className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`border relative whitespace-nowrap font-mono text-xs uppercase tracking-tag px-5 py-3 rounded-t-sm border border-b-0 transition-colors ${
                  isActive
                    ? "bg-base text-ink border-line hover:text-white"
                    : "bg-transparent text-white/60 border-transparent hover:text-white"
                }`}
              >
                {isActive && (
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-hazard" />
                )}

                {!isActive && (
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <span className="mt-1 block">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && <p className="error-text mb-4">{error}</p>}

        {activeTab === "overview" && (
          <OverviewTab
            assets={assets}
            issues={issues}
            form={form}
            onFormChange={handleFormChange}
            onCreateAsset={handleCreateAsset}
            search={search}
            onSearchChange={setSearch}
            isSuperAdmin={isSuperAdmin}
            onImageChange={setAssetImage}
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
          />
        )}

        {activeTab === "approvals" && (
          <ApprovalsTab isSuperAdmin={isSuperAdmin} />
        )}

        {activeTab === "issues" && (
          <IssueManagementTab
            issues={issues}
            technicians={technicians}
            onAssign={handleAssign}
          />
        )}

        {activeTab === "administrators" && isSuperAdmin && (
          <AdministratorsTab />
        )}

        {activeTab === "technicians" && <TechniciansTab />}

        {activeTab === "users" && <UsersTab />}
      </main>
    </div>
  );
};

export default AdminDashboard;
