# HealthConnect — Team Roles & Responsibilities Matrix (`role.md`)

This document outlines the architectural division of labor, domain ownership, and technical deliverables across the 4-member development team for the **HealthConnect** platform.

---

## 👥 Team Member Breakdown

| Member Name | Core Title & Domain | Frontend Ownership | Backend Ownership | Leadership & DevOps |
| :--- | :--- | :--- | :--- | :--- |
| **Nibir Ahmed** | **Team Leader & Lead Developer**<br>AI Triage & Clinical Diagnosis | Symptom input interface, Multilingual support (Bangla, Banglish, English), Diagnosis results with severity ranking, Patient dashboard | Symptom submission APIs, Diagnosis retrieval, NLP model integration (Python & Hugging Face Transformers), Diagnosis history storage (Firebase / MongoDB) | Task assignment, Sprint planning, Code reviews, Repo governance, Merge conflicts resolution, Documentation |
| **MD Tanvir Hossain Rumon** | **Full-Stack Developer**<br>Admin Governance & Blog CMS | Admin dashboard, Doctor verification panel, User management interface, Platform analytics charts, Blog listing & detail pages with Content Editor | Admin CRUD APIs, Doctor approval workflow engine, Analytics data aggregation, Blog post creation, editing, deletion (MongoDB storage) | Admin security boundaries & compliance audits |
| **Nahid Hasan Nibir** | **Full-Stack Developer**<br>Telemedicine & Doctor Consultation | Doctor directory listing, Doctor profile, Appointment scheduling, Digital prescriptions, Real-time chat | Doctor search APIs, Appointment booking, Schedule management, Digital prescription authoring, Real-time consultation messaging & history tracking | Real-time communication infrastructure |
| **Rimon Kumar Das** | **Full-Stack Developer**<br>Digital Health Vault & Authentication | Login & Registration pages, File upload interface, Medical records timeline, Prescription & Lab report viewer | User registration APIs, JWT authentication, Role-Based Access Control (RBAC), Encrypted file upload/download to AWS S3 with permission governance | Identity security, File encryption & Storage pipeline |

---

## 📋 Detailed Member Responsibilities

### 1. Nibir Ahmed — Team Leader & Lead Developer
* **Primary Feature**: **AI Triage & Clinical Diagnosis**
* **Project Leadership & Governance**:
  - Task assignment, sprint planning, and Agile milestone tracking.
  - Overall project architectural coordination and pull request code reviews.
  - Repository management, branching strategies, and merge conflict resolution.
  - System documentation maintenance (`context.md`, `architecture.md`, `design.md`, `role.md`).
* **Frontend Scope**:
  - Interactive clinical symptom input interface.
  - Multilingual natural language support across **Bangla**, **Banglish**, and **English**.
  - Dynamic diagnosis results interface with clinical triage severity ranking.
  - Personalized patient home dashboard with health vitals and diagnostic summaries.
* **Backend & AI Scope**:
  - RESTful APIs for symptom submission and clinical diagnosis retrieval.
  - NLP model inference pipeline integrating Groq Cloud LLM (`openai/gpt-oss-120b`) and multi-dataset Clinical Knowledge Base.
  - Multi-dataset synthesis merging **Symptom2Disease**, **SymCat / Columbia clinical weights**, and localized **Bangla/Banglish Lexicon** (`src/data/symptom_knowledge_base.json`).
  - Diagnostic history and clinical intake session persistence in Firebase / Health Vault (`health_records`).
* **Jira / Trello Sprint Task Tracking (Current Status)**:
  - `[DONE] HC-AI-101`: Multi-dataset curation & merging (`symptom_knowledge_base.json` with 12+ clinical conditions, multilingual aliases, precautions & emergency flags).
  - `[DONE] HC-AI-102`: Groq Cloud LLM inference service integration (`aiTriageService.js` with `openai/gpt-oss-120b` and deterministic fallback).
  - `[DONE] HC-AI-103`: Dual-layer safety circuit breaker (instant 999 emergency pattern trigger).
  - `[DONE] HC-AI-104`: Clinical UI revamp with severity badge, differential diagnosis progress bars, and precautions checklist ([DiagnosisPage.jsx](file:///Users/mdnibirahmed/Documents/HealthConnect-Web/src/Pages/Patient/DiagnosisPage.jsx)).
  - `[DONE] HC-AI-105`: Cross-module integration with Doctor Directory ([Nahid Hasan Nibir](file:///Users/mdnibirahmed/Documents/HealthConnect-Web/role.md#L68)) via auto-filtered specialty query parameters.
  - `[DONE] HC-AI-106`: Cross-module integration with Health Vault ([Rimon Kumar Das](file:///Users/mdnibirahmed/Documents/HealthConnect-Web/role.md#L85)) via 1-click triage export to `health_records`.

---

### 2. MD Tanvir Hossain Rumon — Full-Stack Developer
* **Primary Feature**: **Admin Panel & Blog CMS**
* **Frontend Scope**:
  - Executive administrative dashboard with high-level system metrics.
  - Practitioner credential and license verification panel (Approve / Reject workflow).
  - Platform user management interface with role assignment and account governance.
  - Visual platform analytics charts and operational metrics tracking.
  - Health articles & blog portal: listing view, full article view, and rich content editor.
* **Backend Scope**:
  - Administrative CRUD APIs for system-wide configuration and governance.
  - Doctor review and approval workflow transition engine.
  - Analytics data aggregation queries for user, doctor, and consultation throughput.
  - Blog post publishing, editing, and deletion APIs with MongoDB persistence.

---

### 3. Nahid Hasan Nibir — Full-Stack Developer
* **Primary Feature**: **Telemedicine & Doctor Consultation**
* **Frontend Scope**:
  - Searchable and specialty-categorized physician directory.
  - Detailed doctor profile view displaying availability slots, experience, and fees.
  - Patient appointment scheduling calendar and time-slot reservation system.
  - Digital prescription authoring and patient medical record inspection during consultations.
  - Real-time two-way doctor-patient messaging chat.
* **Backend Scope**:
  - APIs for physician directory search and dynamic specialty filtering.
  - Appointment reservation and time-slot collision validation APIs.
  - Doctor practice schedule and recurring availability management.
  - Digital prescription generation and synchronization with patient records.
  - Real-time consultation messaging and history logging.

---

### 4. Rimon Kumar Das — Full-Stack Developer
* **Primary Feature**: **Digital Health Vault & Authentication**
* **Frontend Scope**:
  - Responsive authentication pages for User Login and Registration.
  - Drag-and-drop file upload interface for diagnostic and medical documents.
  - Interactive medical records chronological timeline.
  - In-browser viewer for digital prescriptions and laboratory diagnostic reports.
* **Backend Scope**:
  - User registration and credential hashing endpoints.
  - Secure JWT authentication and token lifecycle management.
  - Strict Role-Based Access Control (RBAC) middleware for API routes.
  - File upload/download pipeline to **AWS S3** with encryption and time-limited pre-signed URL access controls.

---

## 🔄 Inter-Module Integration Points

```
+-------------------------------------------------------------------------------------------------+
|                                         HEALTHCONNECT CORE                                      |
+-------------------------------------------------------------------------------------------------+
|                                                                                                 |
|   [Rimon Kumar Das]               [Nibir Ahmed]                    [Nahid Hasan Nibir]          |
|   Auth & Security RBAC ---------> AI Clinical Triage ------------> Doctor Search & Booking      |
|           |                                                                 |                   |
|           |                                                                 |                   |
|           v                                                                 v                   |
|   Digital Health Vault <----------------------------------------- Real-Time Chat & Prescriptions|
|                                                                                                 |
|                                    [MD Tanvir Hossain Rumon]                                    |
|                               Admin Governance, Verifications & CMS                             |
|                                                                                                 |
+-------------------------------------------------------------------------------------------------+
```
