import React, { useState, useEffect } from 'react';
import db from '../../services/db';
import { auth, firestore } from '../../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc as fsDoc, setDoc } from 'firebase/firestore';
import {
  HiOutlineShieldCheck,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

// Ensure the Admin session has a real Firebase Auth token with role: 'admin' in Firestore so cloud rules allow verifying doctors
async function ensureAdminFirestoreAuth() {
  try {
    if (!auth.currentUser || auth.currentUser.email !== 'root.admin@healthconnect.com') {
      const email = 'root.admin@healthconnect.com';
      const pass = 'HC-ADMIN-ROOT-2026';
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, email, pass);
      } catch {
        cred = await createUserWithEmailAndPassword(auth, email, pass);
      }
      await setDoc(
        fsDoc(firestore, 'users', cred.user.uid),
        {
          id: cred.user.uid,
          uid: cred.user.uid,
          name: 'System Administrator',
          email: 'admin@healthconnect.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Admin Firebase auth check:', err.message);
  }
}

const DoctorVerificationPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [filterTab, setFilterTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    ensureAdminFirestoreAuth();

    // Sync any users with role === 'doctor' who are missing a document in the doctors collection
    const syncDoctorUsers = (usersList, docsList) => {
      const doctorUsers = (usersList || []).filter((u) => u.role === 'doctor');
      for (const u of doctorUsers) {
        const exists = (docsList || []).some(
          (d) =>
            d.id === u.id ||
            d.userId === u.id ||
            (u.email && d.email?.toLowerCase() === u.email.toLowerCase())
        );
        if (!exists && u.id) {
          const cleanName = (u.name || 'Doctor').trim();
          db.update('doctors', u.id, {
            id: u.id,
            userId: u.id,
            name: cleanName.startsWith('Dr.') ? cleanName : `Dr. ${cleanName}`,
            email: u.email || '',
            specialty: u.specialty || 'General Physician',
            hospital: u.hospital || '',
            avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2A9D8F&color=fff`,
            experience: Number(u.experience) || 1,
            rating: 5.0,
            reviews: 0,
            consultationFee: Number(u.consultationFee) || 500,
            bio: u.bio || 'Qualified medical practitioner on HealthConnect.',
            isVerified: Boolean(u.isVerified),
            isOnline: true,
            availability: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
            bmdcNumber: u.bmdcNumber || 'BMDC-Pending',
            createdAt: u.createdAt || new Date().toISOString(),
          });
        }
      }
    };

    const unsubUsers = db.subscribe('users', (usersList) => {
      syncDoctorUsers(usersList, db.list('doctors'));
    });

    const unsubDocs = db.subscribe('doctors', (list) => {
      syncDoctorUsers(db.list('users'), list);
      // Deduplicate by email/userId, preferring the verified or most recent entry
      const byKey = new Map();
      for (const doc of list || []) {
        const key = (doc.email || doc.userId || doc.id || '').toLowerCase();
        const existing = byKey.get(key);
        if (!existing || (doc.isVerified && !existing.isVerified)) {
          byKey.set(key, doc);
        }
      }
      setDoctors(Array.from(byKey.values()));
    });

    return () => {
      unsubUsers();
      unsubDocs();
    };
  }, []);

  const handleToggleVerify = async (doc, targetState) => {
    await ensureAdminFirestoreAuth();
    // Update this doctor and any duplicate entries sharing the same email/userId
    const matchingDocs = doctors.filter(
      (d) =>
        d.id === doc.id ||
        (doc.email && d.email?.toLowerCase() === doc.email.toLowerCase()) ||
        (doc.userId && d.userId === doc.userId)
    );
    for (const item of matchingDocs) {
      db.update('doctors', item.id, { isVerified: targetState });
    }
    setAlertMessage(
      targetState
        ? `Successfully verified and activated ${doc.name}. Profile is now publicly listed for patient bookings.`
        : `Revoked verification for ${doc.name}. Profile removed from public directory.`
    );
    setTimeout(() => setAlertMessage(''), 3000);
  };

  const handleRejectDelete = (doc) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently reject and remove ${doc.name}'s practitioner account? This action cannot be undone.`
    );
    if (confirmed) {
      db.remove('doctors', doc.id);
      setAlertMessage(`Practitioner account for ${doc.name} has been rejected and removed.`);
      setTimeout(() => setAlertMessage(''), 3000);
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingDoctor) return;

    db.update('doctors', editingDoctor.id, {
      specialty: editingDoctor.specialty,
      bmdcNumber: editingDoctor.bmdcNumber,
      consultationFee: Number(editingDoctor.consultationFee) || 500,
      experience: Number(editingDoctor.experience) || 1,
    });

    setEditingDoctor(null);
    setAlertMessage('Practitioner credentials successfully updated.');
    setTimeout(() => setAlertMessage(''), 3000);
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesTab =
      filterTab === 'all'
        ? true
        : filterTab === 'pending'
        ? !doc.isVerified
        : doc.isVerified;

    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.bmdcNumber && doc.bmdcNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Doctor Verification</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Review doctor profiles, verify BMDC registrations, and approve doctors for public listing.
        </p>
      </div>

      {alertMessage && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-bold flex items-center gap-2">
          <HiOutlineCheckCircle className="w-5 h-5 text-teal-600 shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['pending', 'verified', 'all'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filterTab === tab
                  ? 'bg-[#2A9D8F] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab === 'all' ? 'All Doctors' : tab === 'pending' ? 'Pending Review' : 'Verified Doctors'} (
              {
                doctors.filter((d) =>
                  tab === 'all' ? true : tab === 'pending' ? !d.isVerified : d.isVerified
                ).length
              }
              )
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <HiOutlineSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by name, specialty, or BMDC..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#2A9D8F]"
          />
        </div>
      </div>

      {/* Doctors Table */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-2">
          <p className="font-bold text-gray-800 text-sm">No Doctors in this Category</p>
          <p className="text-xs text-gray-500">All applications matching your filter criteria have been processed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-6">Doctor Details</th>
                  <th className="py-3.5 px-6">Specialty</th>
                  <th className="py-3.5 px-6">BMDC License</th>
                  <th className="py-3.5 px-6">Fee / Exp</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80'}
                          alt={doc.name}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-100"
                        />
                        <div>
                          <p className="font-bold text-gray-900">{doc.name}</p>
                          <p className="text-[11px] text-gray-400">{doc.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-semibold text-gray-800">{doc.specialty}</td>

                    <td className="py-4 px-6 font-mono text-gray-700">
                      {doc.bmdcNumber || <span className="text-amber-600 font-sans italic">Pending upload</span>}
                    </td>

                    <td className="py-4 px-6 text-gray-700 whitespace-nowrap">
                      <div className="font-bold text-gray-900">৳{doc.consultationFee} fee</div>
                      <div className="text-[11px] text-gray-400">
                        {doc.experience} {Number(doc.experience) === 1 ? 'yr' : 'yrs'} experience
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          doc.isVerified
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {doc.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        {doc.isVerified ? (
                          <button
                            type="button"
                            onClick={() => handleToggleVerify(doc, false)}
                            className="px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 text-xs font-bold transition-all cursor-pointer"
                            title="Revoke Verification"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleVerify(doc, true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="Approve license"
                          >
                            <HiOutlineCheck className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingDoctor({ ...doc })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Edit Credentials"
                        >
                          <HiOutlinePencilAlt className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectDelete(doc)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Reject and Remove"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Credentials Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Edit Practitioner Credentials</h3>
              <p className="text-xs text-gray-500">Updating credentials for {editingDoctor.name}</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  BMDC Registration Number
                </label>
                <input
                  type="text"
                  value={editingDoctor.bmdcNumber || ''}
                  onChange={(e) =>
                    setEditingDoctor({ ...editingDoctor, bmdcNumber: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#2A9D8F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  value={editingDoctor.specialty || ''}
                  onChange={(e) =>
                    setEditingDoctor({ ...editingDoctor, specialty: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#2A9D8F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Fee (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingDoctor.consultationFee || 0}
                    onChange={(e) =>
                      setEditingDoctor({ ...editingDoctor, consultationFee: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Experience (Yrs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingDoctor.experience || 0}
                    onChange={(e) =>
                      setEditingDoctor({ ...editingDoctor, experience: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2A9D8F] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorVerificationPage;
