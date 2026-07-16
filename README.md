# MaintainIQ

**AI-Powered QR Maintenance & Asset Management Platform**
*Scan. Report. Diagnose. Maintain.*

---

## 🚀 Live Links & Demo

- **Frontend (Live):** [https://maintainiq-frontend.vercel.app](https://maintainiq-frontend.vercel.app)
- **Backend API (Live):** [https://maintainiq-hackathon.onrender.com](https://maintainiq-hackathon.onrender.com)
- **Demo Credentials:**
  - **Super Admin:** 
  - *(Feel free to register a new User or Technician or adminstrator account via the `/register` page using the OTP flow).*
  You can access your account once Super ADMIN will aproved your request 

> **Note:** The backend is deployed on Render's free tier. The first request may take 20–30 seconds to wake up from a cold start.

---

## 💡 Project Overview

MaintainIQ is a comprehensive facility and asset management platform designed to replace manual registers and WhatsApp complaints. It gives every physical asset (ACs, projectors, medical equipment) a digital identity via a unique QR code. 

When a user scans the QR code, they can view safe public details and report issues. The platform uses **Generative AI** to instantly triage the complaint (suggesting causes and initial checks) before routing it through a strict, role-based maintenance workflow. 

**This project demonstrates advanced full-stack capabilities including Cookie-based JWT Auth, strict Role-Based Access Control (RBAC), AI integration, PDF generation, and complex database relationships.**

---

## 🛠️ Comprehensive Tech Stack

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS & Custom CSS
- **Routing:** React Router DOM
- **PDF Generation:** `jspdf` (for generating Asset QR Posters and Issue History Reports)
- **QR Generation:** `qrcode` npm package

### Backend & Database
- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB with Mongoose (Complex schemas with population and aggregations)
- **Architecture:** MVC (Model-View-Controller) Pattern

### Security, Auth & Roles
- **Authentication:** HttpOnly Cookie-based JWT (Secure, SameSite configurations for production)
- **Authorization:** Custom Middleware enforcing strict RBAC (Super Admin, Admin, Technician, User)
- **Verification:** Dual OTP System (Nodemailer/Resend) for Signup verification and Guest Issue Reporting.

### Cloud Integrations & AI
- **Generative AI:** OpenRouter API (Multi-model fallback chain for AI Issue Triage)
- **Media Storage:** Cloudinary (For Asset images and maintenance evidence)
- **Deployment:** Vercel (Frontend) & Render (Backend)

---

## 🔥 Core Features & System Architecture

### 1. Advanced Role-Based Access Control (RBAC)
- **Super Admin:** Full system control, including permanent asset deletion and user management.
- **Admin:** Can register assets, generate reports, approve pending signups, and assign issues.
- **Technician:** Restricted access; can only view and update issues explicitly assigned to them.
- **User/Guest:** Can scan QR codes, view public safe-data, and report issues (secured via OTP).

### 2. Smart Asset Management & QR Code Posters
- Complete CRUD operations for physical assets.
- System automatically generates a unique QR code linked to a safe public URL.
- **Print-Ready Exports:** Admins can download a branded A5 PDF Poster for each asset containing the QR code, asset details, and scanning instructions.

### 3. AI Issue Triage
- Converts a user's natural-language complaint (e.g., "AC is making noise and leaking") into structured data.
- Automatically suggests a professional Title, Category, Priority, Possible Causes, and Safe Initial Checks.
- Users can review and edit AI suggestions before final submission.

### 4. Robust Maintenance Workflow & Data Integrity
- Strict server-side validation for status transitions (Reported → Assigned → Inspection Started → Maintenance In Progress → Resolved).
- Cannot resolve an issue without adding a maintenance note.
- **Graceful Orphaned Data Handling:** If a Super Admin deletes an asset, its related issues are not permanently lost. They are preserved as historical records and labeled as *"Asset Removed"* in the dashboards.

### 5. Permanent Asset History & PDF Reporting
- Every meaningful action (status change, assignment, maintenance entry) is automatically logged with the actor, action, and timestamp.
- **Downloadable Reports:** Admins can generate a complete PDF lifecycle report of any issue, detailing reporter info, AI suggestions, technician notes, and status timelines.

---

## 📂 Project Structure

```text
MaintainIQ/
├── backend/
│   ├── config/           # DB, Cloudinary, and SuperAdmin Seed configs
│   ├── controllers/      # Business logic (Auth, Assets, Issues, AI, Public OTP)
│   ├── middleware/       # Cookie-auth, Role checks, Optional Auth, File uploads
│   ├── models/           # Mongoose Schemas (User, Asset, Issue, History, GuestOtp)
│   ├── routes/           # Express API endpoints
│   ├── utils/            # Shared utilities (History Logger, generateOtp, sendEmail)
│   └── server.js         # Entry point
└── frontend/
    └── src/
        ├── api/          # Axios instance (configured withCredentials for cookies)
        ├── components/   # Reusable UI (OtpModal, ProtectedRoutes)
        ├── pages/        # Role-specific Dashboards, Public Registry, Report Issue
        ├── utils/        # Client-side Auth state management
        └── App.jsx       # Route definitions