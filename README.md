# MaintainIQ

**AI-Powered QR Maintenance & Asset History Platform with Enterprise RBAC**
Scan. Report. Diagnose. Maintain.

Built for the SMIT Final Hackathon — Track A (Advanced Full-Stack + GenAI). Originally submitted as a MERN CRUD app; substantially upgraded post-submission with a full role-based access control system, dual OTP verification, cookie-based auth, and a redesigned admin experience.

---

## Live Links

- **Frontend:** https://maintainiq-frontend.vercel.app
- **Backend API:** https://maintainiq-hackathon.onrender.com *(Render free tier — first request after inactivity can take 20–50s to wake up)*

---

## Overview

MaintainIQ gives every physical asset (projector, AC, camera, etc.) a digital identity: a unique asset code, a QR-accessible public page, an AI-assisted issue reporting flow, a controlled maintenance workflow, and a permanent, exportable service history. It's built for schools, hospitals, offices, and facility-management teams who currently track maintenance across registers, phone calls, and WhatsApp.

The QR code is only the entry point — the real product value is in role-based approvals, issue triage, technician assignment, maintenance records, and full audit history.

---

## Key Features

### Authentication & Access Control
- **Cookie-based JWT** (httpOnly, environment-aware `secure`/`sameSite`) — no tokens in localStorage
- **Four-tier role hierarchy**: `superadmin` (seeded once via env vars) → `admin` → `technician` → `user`
- **Approval workflow**: technician/admin signups stay `pending` until reviewed; `user` accounts auto-approve
- **Dual OTP verification**:
  - *Signup OTP* — verifies email before an account can be used
  - *Guest report OTP* — lets anonymous visitors report an issue without creating an account, gated by a 2-minute email OTP
  - Both flows share one reusable 2-step `<OtpModal/>` component with a live countdown and resend

### Admin Dashboard (role-aware, 6 tabs)
- **Overview** — asset registry (card/table toggle, category/status filters, sort, search), asset creation, edit, and delete (delete restricted to Super Admin, enforced server-side)
- **Approvals** — pending technician/admin signups; Super Admin sees both, Admin sees technicians only; certification documents viewable inline
- **Issue Management** — card/table toggle, category/status/sort filters, technician assignment (approved technicians only), full **Issue History Report** PDF export (reporter info, asset snapshot, assignment trail, timeline, maintenance notes)
- **Administrators / Technicians / Users** — management tables with a Granted/Revoked toggle and a Delete action that's disabled until an account is revoked (enforced server-side, not just the UI)

### Asset Management
- Full CRUD: create, edit (popup modal), and delete (Super Admin only)
- Auto-generated QR code linking to the public asset page
- Optional asset photo upload (Cloudinary) — shown alongside the QR on every card
- Downloadable branded **Asset Poster** (PDF) from the public registry, the admin dashboard, or a logged-in user's own dashboard
- Deleting an asset never deletes its issue history — related issues are preserved and clearly marked **"Asset Removed"** everywhere they're referenced (Issue Management, Technician dashboard, User dashboard), and are excluded from the live "Open Issues" counters since they're no longer actionable

### Issue Reporting & Triage
- **AI Issue Triage** — converts a natural-language complaint into a structured, editable suggestion (title, category, priority, possible causes, initial checks) via a multi-model OpenRouter fallback chain
- Guest reporting requires OTP email verification; logged-in users bypass it entirely
- Controlled status workflow: `Reported → Assigned → Inspection Started → Maintenance In Progress → Resolved → Closed/Reopened`, enforced server-side with no skipped transitions
- A maintenance note is required before an issue can be marked Resolved

### User Dashboard
- **Assets** tab — same registry experience as the public page, poster download without re-verifying
- **My Reported Issues** tab — status of every issue the user has filed, plus the technician's latest maintenance note

### Shared Category System
- A single source of truth (`constants/categories.js`) drives every category dropdown across asset creation, issue reporting, and all filters — including an "Other" custom-entry option — so a typo in one place can no longer fragment filtering everywhere else

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, React Router |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth | JWT via httpOnly cookies, bcrypt, role-based middleware |
| Email/OTP | Twilio SendGrid (Single Sender Verification) |
| AI | OpenRouter (multi-model fallback chain) for Issue Triage |
| QR Codes | `qrcode` npm package |
| PDF Generation | `jsPDF` — asset posters and full issue history reports |
| Media Storage | Cloudinary (technician certifications, asset photos) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Business Rules Enforced Server-Side

- Duplicate asset codes rejected
- No skipping issue status transitions
- Cannot resolve an issue without a maintenance note
- Maintenance cost cannot be negative
- Closed issues are locked until reopened
- Only a `superadmin` can approve/revoke/delete another `admin` account
- Only a revoked account can be deleted (button-disabled client-side **and** rejected server-side)
- Only `superadmin` can delete an asset; edit is available to `admin` and `superadmin`
- Guest issue reports require a valid, unexpired OTP-derived token; logged-in reports are trusted via session cookie

---

## Project Structure

```
Final Hackathon/
├── backend/
│   ├── config/          # DB, Cloudinary, Super Admin seeding
│   ├── controllers/     # auth, asset, issue, maintenance, ai, history, upload, publicAuth
│   ├── middleware/      # cookie-JWT auth, optional-auth, role hierarchy, file upload
│   ├── models/           # User, Asset, Issue, MaintenanceRecord, History, GuestOtp
│   ├── routes/            # Express routers
│   ├── utils/              # OTP generator, SendGrid email, history logger
│   └── server.js
└── frontend/
    └── src/
        ├── api/            # Axios instance (cookie-based, withCredentials)
        ├── components/     # OtpModal, ProtectedRoute
        ├── constants/      # Shared category list
        ├── utils/           # Auth helpers, asset poster generator
        ├── pages/
        │   ├── admin/       # Dashboard tabs, management table, edit modal
        │   ├── AdminDashboard, TechnicianDashboard, UserDashboard
        │   ├── AssetRegistry (public "/"), PublicAssetPage, ReportIssue
        │   └── Login, Register
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
#   SUPER_ADMIN_EMAIL=
#   SUPER_ADMIN_PASSWORD=
#   SENDGRID_API_KEY=
#   SENDGRID_FROM_EMAIL=        # must match your SendGrid verified single sender
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

> `NODE_ENV=production` is set automatically by Render — don't set it locally, since cookie behavior (`secure`/`sameSite`) depends on its absence in development.

---

## API Overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public (starts signup OTP flow) |
| POST | `/api/auth/verify-otp` | Public |
| POST | `/api/auth/login` / `/logout` | Public / Logged in |
| GET | `/api/auth/pending` | Admin, Super Admin |
| GET | `/api/auth/list` | Admin, Super Admin |
| PUT | `/api/auth/:id/status` | Admin, Super Admin |
| DELETE | `/api/auth/:id` | Admin, Super Admin (admin accounts: Super Admin only) |
| POST/GET/PUT/DELETE | `/api/assets` | Logged in (delete: Super Admin only) |
| GET | `/api/public/assets`, `/api/public/asset/:code` | Public |
| POST | `/api/public/otp/send`, `/otp/verify` | Public (guest reporting) |
| POST | `/api/issues` | Public (OTP-gated) / Logged in (bypass) |
| GET/PUT | `/api/issues` | Logged in |
| POST | `/api/maintenance` | Admin, Technician |
| GET | `/api/history/:assetId`, `/history/issue/:issueId` | Logged in |
| POST | `/api/ai/triage` | Public |
| POST | `/api/upload` | Logged in (Cloudinary evidence upload) |

---

## Known Limitations

- No automated test suite
- Issue History Report PDF export is Admin-only (not surfaced to Technician/User dashboards)
- "My Reported Issues" has no search/filter yet
- Asset deletion is permanent (no soft-delete/restore)

---

## AI Usage Disclosure

AI assistance (Claude) was used extensively throughout development — initial scaffolding, the RBAC/OTP/cookie-auth architecture redesign, debugging (SMTP deliverability, deployment/DNS issues, race conditions), and structuring the AI Issue Triage prompt. All architecture decisions, business logic, and final implementation were reviewed, tested, and understood by the developer.
