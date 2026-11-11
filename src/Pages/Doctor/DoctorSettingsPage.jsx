import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import {
  HiOutlineAdjustments,
  HiOutlineSave,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineCheck,
} from 'react-icons/hi';

const ALL_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
];

const SPECIALTIES = [
  'Cardiology',
  'General Physician',
  'Dermatology',
  'Pediatrics',
  'Family Medicine',
  'Orthopedics',
  'Neurology',
];

const DoctorSettingsPage = () => {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);

  // Form State
  const [fee, setFee] = useState(500);
  const [specialty, setSpecialty] = useState('General Physician');
  const [bio, setBio] = useState('');
  const [bmdcNumber, setBmdcNumber] = useState('');
  const [experience, setExperience] = useState(1);
  const [availability, setAvailability] = useState(['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    let initialized = false;
    return db.subscribe('doctors', (list) => {
      const matches = (list || []).filter(
        (d) =>
          d.id === user.id ||
          d.userId === user.id ||
          (user.email && d.email?.toLowerCase() === user.email.toLowerCase())
      );
      const doc = matches.find((d) => d.isVerified) || matches[0] || null;
      if (doc) {
        setDoctor(doc);
        if (!initialized) {
          initialized = true;
          setFee(doc.consultationFee || 500);
          setSpecialty(doc.specialty || 'General Physician');
          setBio(doc.bio || '');
          setBmdcNumber(doc.bmdcNumber || '');
          setExperience(doc.experience || 1);
          setAvailability(doc.availability || ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']);
        }
      }
    });
  }, [user]);

  const toggleSlot = (slot) => {
    setAvailability((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    setError('');

    // Input Validation at trust boundary
    const parsedFee = Number(fee);
    if (isNaN(parsedFee) || parsedFee < 0) {
      setError('Consultation fee must be a valid non-negative number.');
      return;
    }

    if (availability.length === 0) {
      setError('Please select at least one active availability slot.');
      return;
    }

    const targetId = doctor?.id || user.id;
    const cleanName = (user?.name || 'Doctor').trim();
    db.update('doctors', targetId, {
      id: targetId,
      userId: user.id,
      name: doctor?.name || (cleanName.startsWith('Dr.') ? cleanName : `Dr. ${cleanName}`),
      email: doctor?.email || user.email || '',
      avatar: doctor?.avatar || user.avatar || '',
      isVerified: Boolean(doctor?.isVerified),
      isOnline: true,
      consultationFee: parsedFee,
      specialty,
      bio: bio.trim(),
      bmdcNumber: bmdcNumber.trim(),
      experience: Number(experience) || 1,
      availability,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Doctor Profile & Availability</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Set your daily consultation hours, visit fee, and qualification details.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
          <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
          Settings saved successfully!
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Availability Slot Matrix */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
            Standard Daily Consultation Slots ({availability.length} Active)
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Patients can only book visits during your selected slots. Toggle hours on or off:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ALL_SLOTS.map((slot) => {
              const active = availability.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => toggleSlot(slot)}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {active ? <><HiOutlineCheck className="w-3.5 h-3.5 inline-block mr-1" />{slot}</> : slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing & Specialty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Consultation Fee (BDT) *
            </label>
            <input
              type="number"
              min="0"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-extrabold focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Medical Specialty
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary"
            >
              {SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Years in Practice
            </label>
            <input
              type="number"
              min="0"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* BMDC & Bio */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              BMDC Registration Number
            </label>
            <input
              type="text"
              value={bmdcNumber}
              onChange={(e) => setBmdcNumber(e.target.value)}
              placeholder="E.g., A-12345"
              className="w-full sm:max-w-xs px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              About Me / Professional Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              maxLength={600}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <HiOutlineSave className="w-4 h-4" />
            <span>Save Practice Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorSettingsPage;
