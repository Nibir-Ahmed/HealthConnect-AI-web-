import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, firestore, googleProvider } from '../services/firebase';
import { authApi } from '../services/api';
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const AuthContext = createContext(null);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthProvider = ({ children }) => {
  // Initialize state; Firebase onAuthStateChanged is the authoritative source
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('healthconnect_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser(userData);
            localStorage.setItem('healthconnect_session', JSON.stringify(userData));
          } else {
            const isAdminEmail =
              firebaseUser.email === 'root.admin@healthconnect.com' ||
              firebaseUser.email === 'admin@healthconnect.com';
            const fallbackUser = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              name: isAdminEmail
                ? 'System Administrator'
                : firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: isAdminEmail ? 'admin@healthconnect.com' : firebaseUser.email,
              role: isAdminEmail ? 'admin' : 'patient',
              avatar:
                firebaseUser.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  isAdminEmail ? 'System Admin' : firebaseUser.displayName || 'User'
                )}&background=2A9D8F&color=fff`,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            };
            await setDoc(userDocRef, fallbackUser, { merge: true }).catch(() => {});
            setUser(fallbackUser);
            localStorage.setItem('healthconnect_session', JSON.stringify(fallbackUser));
          }
        } else {
          // Preserve Master Admin session if active
          const savedSession = localStorage.getItem('healthconnect_session');
          if (savedSession) {
            try {
              const parsed = JSON.parse(savedSession);
              if (parsed?.isMasterAdmin || parsed?.email === 'admin@healthconnect.com') {
                setUser(parsed);
                return;
              }
            } catch {
              // ignore parse error
            }
          }
          setUser(null);
          localStorage.removeItem('healthconnect_session');
        }
      } catch (err) {
        console.error('Error synchronizing auth state:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Validate credentials at trust boundary
  const validateAuthInput = (email, password) => {
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
  };

  // Login handler with role verification
  const login = async (email, password, requestedRole = null) => {
    setLoading(true);
    setError(null);
    try {
      validateAuthInput(email, password);
      const authenticatedUser = await authApi.login({
        email,
        password,
        role: requestedRole,
      });
      setUser(authenticatedUser);
      localStorage.setItem('healthconnect_session', JSON.stringify(authenticatedUser));
      return authenticatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // OAuth Google Login (Explicitly blocked for Admin per context.md Section 3.2)
  const googleLogin = async (role = 'patient') => {
    setLoading(true);
    setError(null);
    try {
      const normalizedRole = role.toLowerCase();
      if (normalizedRole === 'admin') {
        throw new Error('Google Sign-In is prohibited for administrative accounts. Admin must use email credentials.');
      }

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const uid = firebaseUser.uid;

      // Check if user already exists in Firestore
      const userDocRef = doc(firestore, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      let userData;
      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
        if (userData.role === 'admin') {
          await signOut(auth);
          throw new Error('Google Sign-In is prohibited for administrative accounts.');
        }
        await updateDoc(userDocRef, { lastLogin: new Date().toISOString() }).catch(() => {});
      } else {
        const now = new Date().toISOString();
        userData = {
          id: uid,
          uid: uid,
          name: firebaseUser.displayName || 'Google User',
          email: firebaseUser.email,
          role: normalizedRole,
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=2A9D8F&color=fff`,
          phoneNumber: firebaseUser.phoneNumber || '',
          bloodGroup: '',
          gender: '',
          allergies: [],
          emergencyContact: null,
          createdAt: now,
          lastLogin: now,
        };
        await setDoc(userDocRef, userData);

        if (normalizedRole === 'doctor') {
          const doctorProfile = {
            id: uid,
            userId: uid,
            name: userData.name.startsWith('Dr.') ? userData.name : `Dr. ${userData.name}`,
            email: userData.email,
            specialty: 'General Medicine',
            hospital: '',
            avatar: userData.avatar,
            experience: 1,
            rating: 0,
            reviews: 0,
            consultationFee: 500,
            bio: 'Verified healthcare provider.',
            isVerified: false,
            isOnline: true,
            availability: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
            bmdcNumber: '',
            createdAt: now,
          };
          await setDoc(doc(firestore, 'doctors', uid), doctorProfile);
        }
      }

      setUser(userData);
      localStorage.setItem('healthconnect_session', JSON.stringify(userData));
      return userData;
    } catch (err) {
      const msg = err.code === 'auth/popup-closed-by-user' 
        ? 'Google Sign-In was cancelled.' 
        : err.message || 'Google Sign-In failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Register new account with Firebase Auth & Firestore
  const register = async ({ name, email, password, role = 'patient', extra = {} }) => {
    setLoading(true);
    setError(null);
    try {
      validateAuthInput(email, password);
      if (!name || name.trim().length < 2) {
        throw new Error('Please enter your full name (at least 2 characters).');
      }

      const newUser = await authApi.register({ name, email, password, role, extra });
      setUser(newUser);
      localStorage.setItem('healthconnect_session', JSON.stringify(newUser));
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign-out error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('healthconnect_session');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        error,
        login,
        googleLogin,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

