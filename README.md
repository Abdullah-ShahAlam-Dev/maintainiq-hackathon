# MaintainIQ

**AI-Powered QR Maintenance & Asset History Platform**
Scan. Report. Diagnose. Maintain.

Built for the SMIT Final Hackathon — Track A (Advanced Full-Stack + GenAI)

---

## Live Links

- **Frontend (live):** https://maintainiq-frontend.vercel.app
- **Backend API (live):** https://maintainiq-hackathon.onrender.com
- **Demo credentials:**
  - Admin — `admin@test.com` / `123456`
  - Technician — *(register one at `/register`, or add here once created)*

> Note: the backend is on Render's free tier, so the first request after inactivity can take 20–30 seconds to wake up.

---

## Overview

MaintainIQ gives every physical asset (projector, AC, camera, etc.) a digital identity: a unique asset code, a QR-accessible public page, an AI-assisted issue reporting flow, a controlled maintenance workflow, and a permanent service history. It's built for schools, hospitals, offices, and facility-management teams who currently track maintenance across registers, phone calls, and WhatsApp.

The QR code is only the entry point — the real product value is in issue triage, technician assignment, maintenance records, and accountability.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), plain JavaScript, React Router |
| Backend | Node.js, Express, plain JavaScript |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt, role-based (Admin / Technician) |
| AI | OpenRouter (multi-model fallback chain) for AI Issue Triage |
| QR Codes | `qrcode` npm package |
| Media Storage | Cloudinary |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Core Features

- **Asset Management** — register assets with a unique code, category, location, condition, and service dates
- **QR Code Generation** — auto-generated on asset creation, links to a safe public asset page
- **Public Asset Page** — no login required; shows safe info only (no private notes/costs)
- **AI Issue Triage** — converts a natural-language complaint into a structured, editable suggestion (title, category, priority, possible causes, initial checks) before submission
- **Issue Reporting** — public reporting form, tied to a specific asset
- **Assignment Workflow** — admin assigns issues to technicians
- **Maintenance Workflow** — controlled status transitions (Reported → Assigned → Inspection Started → Maintenance In Progress → Resolved → Closed/Reopened), technicians can only act on their own assigned issues
- **Business Rule Enforcement** (server-side, not just UI):
  - Duplicate asset codes rejected
  - No skipping status transitions
  - Cannot resolve an issue without a maintenance note
  - Maintenance cost cannot be negative
  - Next service date cannot be before the completion date
  - Closed issues are locked until reopened
- **Asset History** — every meaningful action (status change, assignment, maintenance entry) is automatically logged with actor, action, and timestamp

---

## Project Structure

```
Final Hechathon/
├── backend/
│   ├── config/          # DB + Cloudinary config
│   ├── controllers/      # Route logic (auth, asset, issue, maintenance, ai, history, upload)
│   ├── middleware/       # JWT auth, role-check, file upload
│   ├── models/            # Mongoose schemas (User, Asset, Issue, MaintenanceRecord, History)
│   ├── routes/             # Express routers
│   ├── utils/               # Shared helpers (history logger)
│   └── server.js
└── frontend/
    └── src/
        ├── api/           # Axios instance with JWT interceptor
        ├── components/    # ProtectedRoute
        ├── pages/          # Login, Register, AdminDashboard, TechnicianDashboard,
        │                   # PublicAssetPage, ReportIssue
        ├── utils/          # Auth helpers (localStorage token/user)
        └── App.jsx
```

---

## Running Locally

### Backend
```bash
cd backend
npm install
# create a .env file with:
#   MONGODB_URI=
#   JWT_SECRET=
#   PORT=5000
#   FRONTEND_URL=http://localhost:5173
#   OPENROUTER_API_KEY=
#   CLOUDINARY_CLOUD_NAME=
#   CLOUDINARY_API_KEY=
#   CLOUDINARY_API_SECRET=
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## API Overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/technicians` | Admin |
| POST | `/api/assets` | Admin |
| GET | `/api/assets` | Logged in |
| GET | `/api/public/asset/:code` | Public (safe fields only) |
| POST | `/api/issues` | Public (issue reporting) |
| GET | `/api/issues` | Logged in |
| PUT | `/api/issues/:id/assign` | Admin |
| PUT | `/api/issues/:id/status` | Admin / assigned Technician |
| PUT | `/api/issues/:id/reopen` | Admin |
| POST | `/api/maintenance` | Admin / Technician |
| GET | `/api/history/:assetId` | Logged in |
| POST | `/api/ai/triage` | Public |
| POST | `/api/upload` | Logged in (Cloudinary evidence upload) |

---

## Known Limitations

- Asset history is fully tracked on the backend, but there's no dedicated frontend timeline view yet.
- Evidence photo/video upload endpoint (Cloudinary) is built but not yet wired into the Report Issue / Maintenance Note forms.

---

## AI Usage Disclosure

AI assistance (Claude) was used during development for scaffolding, debugging deployment/DNS issues, and structuring the AI Issue Triage prompt. All architecture decisions, business logic, and final implementation were reviewed and understood by the developer.
