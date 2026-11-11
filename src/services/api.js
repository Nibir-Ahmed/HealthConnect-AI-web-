import db from './db';
import { auth, firestore } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { avatarFor } from '../utils/avatar';

/**
 * HealthConnect Database & API Service Layer
 * 
 * - Authentication & User profiles are backed by Firebase Auth & Cloud Firestore.
 * - Supporting clinical data entities default to local reactive storage during initial phase.
 */

// Use Firebase Auth & Cloud Firestore directly (no localhost:5000 proxy)
const API_BASE_URL = null;

const formatAuthError = (err) => {
  const code = err?.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password. Please try again.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters long.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many unsuccessful attempts. Access temporarily restricted. Try again later.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google Sign-In was cancelled.';
  }
  return err.message || 'An authentication error occurred.';
};

const getAuthHeaders = () => {
  const sessionStr = localStorage.getItem('healthconnect_session');
  if (!sessionStr) return { 'Content-Type': 'application/json' };
  try {
    const session = JSON.parse(sessionStr);
    return {
      'Content-Type': 'application/json',
      ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

async function http(endpoint, options = {}) {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || `API error: ${res.statusText}`);
    }
    return data;
  }
  return null;
}

// -------------------------------------------------------------
// Authentication & User APIs (Powered by Firebase Auth & Firestore)
// -------------------------------------------------------------
export const authApi = {
  async login({ email, password, role }) {
    if (API_BASE_URL) {
      return http('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } catch (signInErr) {
        // Master Admin Bootstrap: authenticate with a real Firebase Auth session so Firestore isAdmin() rules pass
        if (
          normalizedEmail === 'admin@healthconnect.com' &&
          (password === 'admin123' || password === 'admin123456' || password === 'HC-ADMIN-ROOT-2026')
        ) {
          const fallbackAuthEmail = 'root.admin@healthconnect.com';
          const fallbackAuthPass = 'HC-ADMIN-ROOT-2026';
          try {
            userCredential = await signInWithEmailAndPassword(auth, fallbackAuthEmail, fallbackAuthPass);
          } catch {
            userCredential = await createUserWithEmailAndPassword(auth, fallbackAuthEmail, fallbackAuthPass);
          }
          const adminUid = userCredential.user.uid;
          const now = new Date().toISOString();
          const adminProfile = {
            id: adminUid,
            uid: adminUid,
            name: 'System Administrator',
            email: normalizedEmail,
            role: 'admin',
            isMasterAdmin: true,
            avatar: avatarFor('System Admin'),
            createdAt: now,
            lastLogin: now,
          };
          await setDoc(doc(firestore, 'users', adminUid), adminProfile, { merge: true });
          return adminProfile;
        }
        throw signInErr;
      }
      const uid = userCredential.user.uid;

      // Fetch user profile from Firestore
      const userDocRef = doc(firestore, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      let userData;
      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
      } else {
        // Fallback profile if user was created directly in Auth
        userData = {
          id: uid,
          uid: uid,
          name: userCredential.user.displayName || email.split('@')[0],
          email: normalizedEmail,
          role: (role ? role.toLowerCase() : 'patient'),
          avatar: userCredential.user.photoURL || avatarFor(email.split('@')[0]),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        await setDoc(userDocRef, userData);
      }

      // Check role authorization against requested role
      if (role && userData.role && userData.role.toLowerCase() !== role.toLowerCase()) {
        await signOut(auth);
        throw new Error(`This account is registered as '${userData.role}'. Please select the '${userData.role}' role tab.`);
      }

      // Update lastLogin timestamp
      await updateDoc(userDocRef, { lastLogin: new Date().toISOString() }).catch(() => {});

      return userData;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  async register({ name, email, password, role = 'patient', extra = {} }) {
    if (API_BASE_URL) {
      return http('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, ...extra }),
      });
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedRole = (role || 'patient').toLowerCase();

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const uid = userCredential.user.uid;
      const now = new Date().toISOString();

      const userProfile = {
        id: uid,
        uid: uid,
        name: name.trim(),
        email: normalizedEmail,
        role: normalizedRole,
        avatar: avatarFor(name.trim()),
        phoneNumber: extra.phone || extra.phoneNumber || '',
        bloodGroup: extra.bloodGroup || '',
        gender: extra.gender || '',
        allergies: extra.allergies || [],
        emergencyContact: extra.emergencyContact || null,
        createdAt: now,
        lastLogin: now,
      };

      // Write to Firestore users collection
      await setDoc(doc(firestore, 'users', uid), userProfile);

      // If doctor, initialize profile in doctors collection per architecture.md
      if (normalizedRole === 'doctor') {
        const doctorProfile = {
          id: uid,
          userId: uid,
          name: name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
          email: normalizedEmail,
          specialty: extra.specialty || 'General Medicine',
          hospital: extra.hospital || '',
          avatar: userProfile.avatar,
          experience: Number(extra.experience) || 1,
          rating: 0,
          reviews: 0,
          consultationFee: Number(extra.consultationFee) || 500,
          bio: extra.bio || '',
          isVerified: false, // Per architecture.md: Invariant: Admin must verify
          isOnline: true,
          availability: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
          bmdcNumber: extra.bmdcNumber || '',
          createdAt: now,
        };
        await setDoc(doc(firestore, 'doctors', uid), doctorProfile);
      }

      return userProfile;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  async updateProfile(userId, updates) {
    if (API_BASE_URL) {
      return http(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    }
    await updateDoc(doc(firestore, 'users', userId), updates);
    return { id: userId, ...updates };
  },

  async getUsers() {
    if (API_BASE_URL) {
      return http('/users');
    }
    const snapshot = await getDocs(collection(firestore, 'users'));
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  },
};

// -------------------------------------------------------------
// Doctors & Practice APIs
// -------------------------------------------------------------
export const doctorsApi = {
  async getAll({ specialty, query, verifiedOnly = true } = {}) {
    if (API_BASE_URL) {
      const params = new URLSearchParams();
      if (specialty && specialty !== 'All') params.append('specialty', specialty);
      if (query) params.append('q', query);
      if (verifiedOnly) params.append('verifiedOnly', 'true');
      return http(`/doctors?${params.toString()}`);
    }

    return db.list('doctors', (doc) => {
      if (verifiedOnly && !doc.isVerified) return false;
      if (specialty && specialty !== 'All' && doc.specialty?.toLowerCase() !== specialty.toLowerCase()) return false;
      if (query) {
        const q = query.toLowerCase();
        return doc.name?.toLowerCase().includes(q) || doc.specialty?.toLowerCase().includes(q);
      }
      return true;
    });
  },

  async getById(id) {
    if (API_BASE_URL) {
      return http(`/doctors/${id}`);
    }
    return db.get('doctors', id);
  },

  async updateDoctor(id, updates) {
    if (API_BASE_URL) {
      return http(`/doctors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    }
    return db.update('doctors', id, updates);
  },

  async verifyDoctor(id, isVerified) {
    if (API_BASE_URL) {
      return http(`/doctors/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ isVerified }),
      });
    }
    return db.update('doctors', id, { isVerified });
  },
};

// -------------------------------------------------------------
// Appointments APIs
// -------------------------------------------------------------
export const appointmentsApi = {
  async getAll({ patientId, doctorId, status } = {}) {
    if (API_BASE_URL) {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (doctorId) params.append('doctorId', doctorId);
      if (status) params.append('status', status);
      return http(`/appointments?${params.toString()}`);
    }

    return db.list('appointments', (apt) => {
      if (patientId && apt.patientId !== patientId) return false;
      if (doctorId && apt.doctorId !== doctorId) return false;
      if (status && apt.status !== status) return false;
      return true;
    });
  },

  async create(appointmentData) {
    if (API_BASE_URL) {
      return http('/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData),
      });
    }
    return db.add('appointments', appointmentData);
  },

  async updateStatus(id, status) {
    if (API_BASE_URL) {
      return http(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    }
    return db.update('appointments', id, { status });
  },
};

// -------------------------------------------------------------
// Prescriptions APIs
// -------------------------------------------------------------
export const prescriptionsApi = {
  async getAll({ patientId, doctorId } = {}) {
    if (API_BASE_URL) {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (doctorId) params.append('doctorId', doctorId);
      return http(`/prescriptions?${params.toString()}`);
    }

    return db.list('prescriptions', (p) => {
      if (patientId && p.patientId !== patientId) return false;
      if (doctorId && p.doctorId !== doctorId) return false;
      return true;
    });
  },

  async create(prescriptionData) {
    if (API_BASE_URL) {
      return http('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(prescriptionData),
      });
    }
    return db.add('prescriptions', prescriptionData);
  },
};

// -------------------------------------------------------------
// Health Records & Vault APIs
// -------------------------------------------------------------
export const healthRecordsApi = {
  async getAll({ patientId } = {}) {
    if (API_BASE_URL) {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      return http(`/health-records?${params.toString()}`);
    }
    return db.list('health_records', (r) => (!patientId || r.patientId === patientId));
  },

  async upload(recordData) {
    if (API_BASE_URL) {
      return http('/health-records', {
        method: 'POST',
        body: JSON.stringify(recordData),
      });
    }
    return db.add('health_records', recordData);
  },

  async delete(id) {
    if (API_BASE_URL) {
      return http(`/health-records/${id}`, {
        method: 'DELETE',
      });
    }
    return db.remove('health_records', id);
  },
};

// -------------------------------------------------------------
// System Config APIs
// -------------------------------------------------------------
export const systemApi = {
  async getConfig() {
    if (API_BASE_URL) {
      return http('/system/config');
    }
    return db.get('system_config');
  },

  async updateConfig(updates) {
    if (API_BASE_URL) {
      return http('/system/config', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    }
    return db.update('system_config', null, updates);
  },
};

export default {
  auth: authApi,
  doctors: doctorsApi,
  appointments: appointmentsApi,
  prescriptions: prescriptionsApi,
  healthRecords: healthRecordsApi,
  system: systemApi,
};
