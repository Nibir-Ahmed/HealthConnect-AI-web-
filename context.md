# HealthConnect — System Context Specification (`context.md`)

## 1. Domain & Operational Scope
HealthConnect is a full-stack, cross-platform telemedicine and emergency triage platform built for three distinct operational roles: **Patient**, **Doctor**, and **Administrator**. The platform couples real-time reactive data streams (Cloud Firestore) with an on-demand clinical triage engine powered by Groq Cloud LLMs and deterministic local fallbacks.

The system operates across three trust boundaries:
1. **Client Runtime Boundary**: Mobile/Web frontend executing on React Native (Expo SDK 57) across Android, iOS, and Web.
2. **Backend as a Service (BaaS) Boundary**: Firebase Authentication, Cloud Firestore document collections, and Firebase Cloud Storage.
3. **External Intelligence Boundary**: Groq Cloud completions API endpoint (`https://api.groq.com/openai/v1/chat/completions`) utilizing `openai/gpt-oss-120b`, grounded by a multi-dataset Clinical Knowledge Base (`src/data/symptom_knowledge_base.json` merging Symptom2Disease, SymCat, and multilingual Banglish/Bengali lexicons) with deterministic local fallback engines.

---

## 2. Core Actors & Authorization Matrix

| Actor | Identification Method | Role Identifier | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Patient** | Firebase Auth UID (`users/{uid}`) | `role: 'patient'` | Self-triage, physician directory lookup, appointment booking, health vault management, emergency medical card export, two-way tele-consultation. |
| **Doctor** | Firebase Auth UID + `doctors/{uid}` | `role: 'doctor'` | Availability slot scheduling, appointment triage (accept/complete/cancel), live tele-consultation, digital prescription authoring, patient vault inspection. |
| **Admin** | Firebase Auth UID (`users/{uid}`) | `role: 'admin'` | Doctor credential audit and license verification, user directory governance, role assignment, health article publication, global maintenance toggling. |

---

## 3. Trust Boundaries & Invariant Rules

### 3.1 Input Validation at Boundaries
- **Authentication**: Password length minimum 6 characters (Firebase Auth specification). Strict email format validation prior to dispatch.
- **Appointment Scheduling**: Slots constrained to verified doctor availability arrays (`['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']`). Duplicate bookings for identical timestamps are rejected at the Firestore query layer.
- **Digital Prescriptions**: Medications array strictly typed containing non-empty strings: `name`, `dosage`, `frequency`, `duration`.
- **File Uploads**: Health Vault documents restricted to MIME types `application/pdf`, `image/jpeg`, and `image/png` with maximum file size 10MB.
- **AI Triage Queries**: String sanitization removing non-printable control characters; length bounded to 1,000 characters per message.

### 3.2 Security Invariants
- Admin authentication is restricted to email/password credentials; third-party OAuth (Google Sign-In) is explicitly prohibited for administrative accounts to enforce single-factor perimeter control.
- Doctor profiles remain in an unverified state (`isVerified: false`) until explicitly authenticated and toggled by an authenticated user carrying `role: 'admin'`.
- Unverified doctors cannot be queried by patient clients in active booking searches (`doctors` where `isVerified == true`).
- System-wide maintenance mode blocks all non-admin client interactions at the root navigation layer via `AppNavigator.js`.

---

## 4. Step-Wise Domain Progression Model

```mermaid
flowchart TD
    subgraph Step 1: Patient Domain
        P1[User Registration & Auth] --> P2[AI Clinical Triage Engine]
        P2 --> P3[Doctor Search & Directory Filtering]
        P3 --> P4[Appointment Slot Reservation]
        P4 --> P5[Live Tele-Consultation & Vault Sharing]
        P5 --> P6[Emergency Card & PDF Export]
    end

    subgraph Step 2: Doctor Domain
        D1[Doctor Registration & Verification State] --> D2[Availability & Pricing Configuration]
        D2 --> D3[Incoming Appointment Queue Management]
        D3 --> D4[Live Tele-Consultation Stream]
        D4 --> D5[Prescription Generation & Vault Review]
    end

    subgraph Step 3: Admin Domain
        A1[Master Admin Bootstrap & Auth] --> A2[Doctor License Audit & Verification Engine]
        A2 --> A3[User Directory & Role Elevation Management]
        A3 --> A4[Health Article Editorial Pipeline]
        A4 --> A5[Global System Configuration & Maintenance Interceptor]
    end

    Step 1 --> Step 2
    Step 2 --> Step 3
```

---

## 5. Subsystem Contexts

### Step 1: Patient Subsystem Context
1. **Authentication & Profile**: Patients register via Firebase Auth (`createUserWithEmailAndPassword`) or Google Sign-In (`googleLogin`). A base document is written to `users/{uid}` with `role: 'patient'`.
2. **AI Clinical Assistant**: Patients submit clinical symptoms in Banglish, English, or Bengali. If critical keywords are detected (`chest pain`, `cannot breathe`, `stroke`, etc.), the emergency protocol activates immediately, displaying emergency hotline `999` and suppressing non-urgent conversational flows. Non-acute complaints are evaluated against the merged Clinical Knowledge Base (`src/data/symptom_knowledge_base.json`) and synthesized by Groq LLM (`openai/gpt-oss-120b`), generating severity levels, differential diagnoses, actionable self-care precautions, 1-click doctor booking, and export to Health Vault.
3. **Physician Directory**: Queries the `doctors` collection filtered by `isVerified == true`. Provides real-time filtering by `specialty` (e.g., General Medicine, Cardiology, Dermatology, Pediatrics).
4. **Booking Lifecycle**: Creates a record in `appointments` with initial status `upcoming`. Records patient UID, doctor UID, scheduled date, slot time, and consultation fee.
5. **Real-time Consultation**: Synchronizes bidirectional messages in `messages` collection partitioned by `appointmentId` or conversation channel. Patients can upload and link vault document IDs.
6. **Health Vault**: Personal document records stored under `health_records/{recordId}` referencing Firebase Storage bucket URLs, with exportable emergency profile data generated locally via `expo-print`.

### Step 2: Doctor Subsystem Context
1. **Verification Onboarding**: Doctors register with `role: 'doctor'`. Registration writes to `users/{uid}` and initializes an entry in `doctors/{uid}` with default `isVerified: false`.
2. **Practice Configuration**: Doctors configure consultation fee, bio, years of experience, and recurring daily slot availability arrays (`availability: string[]`).
3. **Queue & Appointment Triage**: Doctors subscribe to `appointments` where `doctorId == user.uid`. Doctors transition appointment state through the deterministic lifecycle: `upcoming` -> `completed` or `cancelled`.
4. **Tele-Consultation & Diagnosis**: Doctors engage patients via the real-time chat interface, review patient-shared health vault records, and access patient medical history.
5. **Prescription Engine**: Formulates structured digital prescriptions committed to `prescriptions/{prescriptionId}` linked to `patientId` and `appointmentId`.

### Step 3: Admin Subsystem Context
1. **System Governance**: Operates under authenticated profile with `role: 'admin'`. Initial bootstrap runs deterministically for root admin email `admin@healthconnect.com`.
2. **Doctor Verification Engine**: Listens to `doctors` collection via real-time snapshot. Admin reviews practitioner licenses, edits credentials, and updates `isVerified: true` or rejects/deletes fraudulent accounts.
3. **User Management**: Monitors the `users` collection to audit user distribution, update account metadata, or revoke/elevate roles.
4. **Content Management System (CMS)**: Manages community health articles in `blogs/{blogId}`, with fields for category, title, body content, reading time, author, and cover images.
5. **Global Telemetry & Maintenance**: Maintains platform runtime flags in `system_config/global`, enabling real-time toggling of `maintenanceMode: boolean` and updating platform `emergencyPhone`.

### Step 4: Cross-Cutting Subsystems Context
1. **AI Inference & Fallback Pipeline**: Primary evaluation via Groq Cloud API. If network timeout or API error occurs, system fails over to `runLocalTriageFallback` with zero downtime.
2. **Notification Subsystem**: In-app notifications stored in `notifications/{notificationId}` alerting users to appointment status updates, verification events, and prescription issuance.
3. **Global Network Resilience**: Client uses forced long-polling for Cloud Firestore (`experimentalForceLongPolling: true`) to maintain reliable synchronization across high-latency cellular networks and web browsers.
