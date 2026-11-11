# HealthConnect — Technical Architecture Specification (`architecture.md`)

## 1. System Overview & Technology Stack

HealthConnect implements a reactive, serverless client-cloud architecture. The frontend application is deployed across Android, iOS, and Web from a single codebase via React Native and Expo. The cloud persistence and authentication tiers rely on Firebase services, while clinical natural language inference is offloaded to Groq Cloud LLM instances.

```
+-----------------------------------------------------------------------------------+
|                              CLIENT TIER (Expo SDK 57)                            |
|  +-----------------------------------------------------------------------------+  |
|  |                React Navigation 7 (Role-Based Dynamic Routing)              |  |
|  |  +---------------------+   +--------------------+   +--------------------+  |  |
|  |  |     PatientTabs     |   |     DoctorTabs     |   |     AdminTabs      |  |  |
|  |  +---------------------+   +--------------------+   +--------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
|  |                   AuthContext (Single Source of Truth / RBAC)               |  |
|  +-----------------------------------------------------------------------------+  |
|  | Components: AppointmentCard | ChatBubble | DoctorCard | HealthVaultModal... |  |
+-----------------------------------------------------------------------------------+
                                         |
                       Secure HTTPS / WebSockets / Long-Polling
                                         |
+-----------------------------------------------------------------------------------+
|                              BACKEND SERVICES TIER                                |
|  +------------------------+  +--------------------------+  +-------------------+  |
|  |     Firebase Auth      |  |      Cloud Firestore     |  |  Firebase Storage |  |
|  |  (Email/Pass + OAuth)  |  |  (Real-Time Collections) |  |   (Medical Files) |  |
|  +------------------------+  +--------------------------+  +-------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                           External HTTPS REST (Groq API)
                                         |
+-----------------------------------------------------------------------------------+
|                        EXTERNAL INTELLIGENCE SERVICES                             |
|  +-----------------------------------------------------------------------------+  |
|  | Groq Cloud API (openai/gpt-oss-120b) + Client-side Fallback Heuristic Engine|  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Cloud Firestore Database Schema

All database entities are normalized under top-level Firestore collections to optimize query filtering and real-time document listeners.

### 2.1 Collection: `users`
Key: `userId` (string, matches Firebase Auth UID)
```typescript
interface UserDocument {
  id: string;               // Firebase Auth UID
  uid: string;              // Duplicate UID reference for legacy access
  name: string;             // Full display name
  email: string;            // Normalized lowercase email
  role: 'patient' | 'doctor' | 'admin';
  avatar: string;           // HTTPS URL or UI-Avatars dynamic generation string
  phoneNumber?: string;     // E.164 format or regional number
  bloodGroup?: string;      // 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
  allergies?: string[];     // Array of verified medical allergies
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;        // ISO 8601 UTC timestamp
  lastLogin?: string;       // ISO 8601 UTC timestamp
}
```

### 2.2 Collection: `doctors`
Key: `doctorId` (string, matches Firebase Auth UID)
```typescript
interface DoctorDocument {
  id: string;               // Unique doctor record ID
  userId: string;           // Corresponding users/{uid} key
  name: string;             // Prefix formatted name (e.g., 'Dr. Fahim Ahmed')
  email: string;            // Contact email
  specialty: string;        // Clinical specialty (e.g., 'Cardiology', 'Pediatrics')
  avatar: string;           // Profile asset URL
  experience: number;       // Number of years in practice
  rating: number;           // Calculated rating float (0.0 to 5.0)
  reviews: number;          // Total review count integer
  consultationFee: number;  // Fee value in local currency (BDT)
  bio: string;              // Professional summary
  isVerified: boolean;      // Admin verification flag
  isOnline: boolean;        // Real-time online presence state
  availability: string[];   // Array of available slot times (e.g., ['09:00 AM', '11:00 AM'])
  bmdcNumber?: string;      // Bangladesh Medical and Dental Council Registration Number
  createdAt: string;        // ISO 8601 UTC timestamp
}
```

### 2.3 Collection: `appointments`
Key: Auto-generated Firestore ID
```typescript
interface AppointmentDocument {
  id: string;               // Unique document identifier
  patientId: string;        // Foreign key -> users/{uid}
  patientName: string;      // Patient name snapshot at booking
  patientAvatar?: string;   // Patient avatar URL snapshot
  doctorId: string;         // Foreign key -> doctors/{doctorId}
  doctorName: string;       // Doctor name snapshot
  doctorSpecialty: string;  // Specialty category
  doctorAvatar?: string;    // Doctor avatar URL snapshot
  date: string;             // Appointment date string (YYYY-MM-DD)
  time: string;             // Slot time string (e.g., '10:00 AM')
  status: 'upcoming' | 'completed' | 'cancelled';
  fee: number;              // Consultation fee locked at reservation
  notes?: string;           // Patient intake notes / symptoms description
  createdAt: string;        // ISO 8601 UTC timestamp
}
```

### 2.4 Collection: `prescriptions`
Key: Auto-generated Firestore ID
```typescript
interface PrescriptionDocument {
  id: string;               // Document identifier
  patientId: string;        // Foreign key -> users/{uid}
  patientName: string;      // Patient full name
  appointmentId: string;    // Foreign key -> appointments/{id}
  doctorId: string;         // Foreign key -> doctors/{id}
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
  medications: Array<{
    name: string;           // Commercial or generic medication name
    dosage: string;         // Dosage measure (e.g., '500mg', '10ml')
    frequency: string;      // Regimen schedule (e.g., '1-0-1', 'Once daily')
    duration: string;       // Treatment course (e.g., '7 days')
  }>;
  notes: string;            // Doctor advice, diet instructions, or warning notes
  createdAt: string;        // ISO 8601 UTC timestamp
}
```

### 2.5 Collection: `blogs`
Key: Auto-generated Firestore ID
```typescript
interface BlogDocument {
  id: string;               // Document identifier
  title: string;            // Article heading
  category: string;         // Medical category (e.g., 'Cardiology', 'Mental Health')
  content: string;          // Full article markdown text
  readTime: string;         // Estimated read time string (e.g., '5 min read')
  author: string;           // Author name or publishing department
  authorAvatar: string;     // Author avatar URL
  image: string;            // Article cover image asset path or remote URL
  likes: number;            // Engagement likes counter
  isSaved?: boolean;        // Local/user bookmark flag
  createdAt: string;        // ISO 8601 UTC timestamp
}
```

### 2.6 Collection: `health_records`
Key: Auto-generated Firestore ID
```typescript
interface HealthRecordDocument {
  id: string;               // Unique document identifier
  patientId: string;        // Foreign key -> users/{uid}
  title: string;            // Clinical title (e.g., 'Chest X-Ray Report')
  category: 'prescription' | 'lab_report' | 'vaccination' | 'scan' | 'other';
  date: string;             // Clinical event date (YYYY-MM-DD)
  fileUrl: string;          // Firebase Storage HTTPS download URL
  fileType: string;         // MIME type string
  fileSize: number;         // Size in bytes
  doctorName?: string;      // Attending physician name if recorded
  facility?: string;        // Hospital or laboratory name
  createdAt: string;        // ISO 8601 UTC timestamp
}
```

### 2.7 Collection: `system_config`
Key: Document `global`
```typescript
interface SystemConfigDocument {
  maintenanceMode: boolean; // Global platform lockout flag
  emergencyPhone: string;   // Platform emergency dispatch hotline (default '999')
  announcement?: {
    active: boolean;
    title: string;
    message: string;
    level: 'info' | 'warning' | 'critical';
  };
  minAppVersion?: string;   // Semantic version string for forced client updates
}
```

---

## 3. Firebase Security Rules Specification

Production security rules strictly enforce role-based access control directly on Firestore operations:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isAuthenticated() && getUserData().role == 'admin';
    }

    function isDoctor() {
      return isAuthenticated() && getUserData().role == 'doctor';
    }

    // Users Collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Doctors Collection
    match /doctors/{doctorId} {
      allow read: if true; // Public directory reading
      allow create: if isAuthenticated() && (request.auth.uid == doctorId || isAdmin());
      allow update: if (isAuthenticated() && request.auth.uid == doctorId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['isVerified'])) || isAdmin();
      allow delete: if isAdmin();
    }

    // Appointments Collection
    match /appointments/{appointmentId} {
      allow read: if isAuthenticated() && (
        resource.data.patientId == request.auth.uid || 
        resource.data.doctorId == request.auth.uid || 
        isAdmin()
      );
      allow create: if isAuthenticated() && request.resource.data.patientId == request.auth.uid;
      allow update: if isAuthenticated() && (
        resource.data.patientId == request.auth.uid || 
        resource.data.doctorId == request.auth.uid || 
        isAdmin()
      );
      allow delete: if isAdmin();
    }

    // Prescriptions Collection
    match /prescriptions/{prescriptionId} {
      allow read: if isAuthenticated() && (
        resource.data.patientId == request.auth.uid || 
        resource.data.doctorId == request.auth.uid || 
        isAdmin()
      );
      allow create: if isDoctor() && request.resource.data.doctorId == request.auth.uid;
      allow update: if isDoctor() && resource.data.doctorId == request.auth.uid;
      allow delete: if isAdmin();
    }

    // Health Records Collection
    match /health_records/{recordId} {
      allow read: if isAuthenticated() && (
        resource.data.patientId == request.auth.uid || 
        isAdmin()
      );
      allow create: if isAuthenticated() && request.resource.data.patientId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.patientId == request.auth.uid;
    }

    // Community Blogs Collection
    match /blogs/{blogId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    // System Config Collection
    match /system_config/{configId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

## 4. Step-Wise Architecture Implementation Ladder

### Step 1: Patient Architecture
1. **Auth & Session Initialization**:
   - `AuthContext` provides subscription to `onAuthStateChanged`.
   - On registration, user document initialized in `users/{uid}`.
2. **AI Triage Pipeline**:
   - Endpoint: `POST https://api.groq.com/openai/v1/chat/completions`.
   - Model: `openai/gpt-oss-120b`.
   - Local fallback: Deterministic regex and substring pattern match evaluating `EMERGENCY_KEYWORDS`. Emergency protocol activates immediate redirection to `tel:999` and renders emergency banner.
3. **Doctor Directory Service**:
   - Query: `query(collection(db, 'doctors'), where('isVerified', '==', true))`.
   - In-memory search optimization using case-insensitive specialty and name filtering.
4. **Appointment Booking Engine**:
   - Write: `addDoc(collection(db, 'appointments'), appointmentPayload)`.
   - Query: `query(collection(db, 'appointments'), where('patientId', '==', user.uid))`.
5. **Health Vault & Emergency Card**:
   - Document upload: Firebase Storage path `users/{uid}/vault/{documentId}`.
   - Profile export: Invokes `expo-print` with inline CSS-styled HTML template to compile the emergency medical card into PDF, dispatched via `expo-sharing`.

### Step 2: Doctor Architecture
1. **Onboarding & Verification State**:
   - Doctor registration writes to `users/{uid}` with `role: 'doctor'` and creates unverified profile in `doctors/{uid}` (`isVerified: false`).
2. **Availability Schedule Manager**:
   - Doctor updates `availability` array in `doctors/{uid}` using `updateDoc`.
3. **Appointment Handling Queue**:
   - Real-time listener: `query(collection(db, 'appointments'), where('doctorId', '==', user.uid))`.
   - State transition: Invokes `updateAppointmentStatus(id, 'completed' | 'cancelled')` executing `updateDoc`.
4. **Tele-Consultation Messaging Stream**:
   - Firestore real-time listener `onSnapshot` subscribing to active consultation channel.
5. **Prescription Authoring Pipeline**:
   - Writer: `addDoc(collection(db, 'prescriptions'), prescriptionData)`.
   - Prescriptions link directly to `patientId` and `appointmentId`.

### Step 3: Admin Architecture
1. **Master Admin Perimeter Control**:
   - Restricts login to Email/Password. Blocks Google Sign-In via authentication guard.
2. **Doctor Verification Subsystem**:
   - Listener: `collection(db, 'doctors')` snapshots all doctor entities.
   - Action: Updates `isVerified: true` or calls `deleteDoc` on invalid records.
3. **Directory Auditing & Governance**:
   - Aggregates user counts and role distributions via Firestore listeners on `users` collection.
   - Updates user role permissions via `updateDoc(doc(db, 'users', userId), { role: newRole })`.
4. **Health Article Editorial Engine**:
   - Mutations: Full CRUD on `blogs` collection with immediate distribution to all client feeds.
5. **Platform Resilience & Maintenance Controller**:
   - Atomic update on `system_config/global`: `{ maintenanceMode: boolean, emergencyPhone: string }`.
   - Global interceptor in `AppNavigator.js` responds in real-time, locking out non-admin routes.

### Step 4: Cross-Cutting Systems Architecture
1. **Real-time Networking**: Forced long-polling on Firestore (`experimentalForceLongPolling: true`) guarantees reliability across networks with strict WebSocket firewalls.
2. **Error Recovery & Logging**: Network faults caught gracefully with localized alerts; failure paths guarantee zero silent data truncation.
