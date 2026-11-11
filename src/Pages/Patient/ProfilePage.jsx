import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import logoIcon from '../../assets/Images/logo_icon.jpg';
import {
  HiOutlineIdentification,
  HiOutlinePrinter,
  HiOutlinePhone,
  HiOutlineSave,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ProfilePage = () => {
  const { user } = useAuth();
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [allergiesText, setAllergiesText] = useState((user?.allergies || []).join(', '));
  const [contactName, setContactName] = useState(user?.emergencyContact?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.emergencyContact?.phone || '');
  const [relationship, setRelationship] = useState(user?.emergencyContact?.relationship || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedAllergies = allergiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedFields = {
      phoneNumber: phone.trim(),
      bloodGroup,
      allergies: updatedAllergies,
      emergencyContact: {
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relationship: relationship.trim(),
      },
    };

    db.update('users', user.id, updatedFields);
    localStorage.setItem(
      'healthconnect_session',
      JSON.stringify({ ...user, ...updatedFields })
    );

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Emergency Medical Profile</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Certified critical medical data for first responders and immediate export.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <HiOutlinePrinter className="w-4 h-4" />
          <span>Export Medical Card PDF</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
          <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
          Emergency Profile successfully updated and synchronized!
        </div>
      )}

      {/* Printable Emergency Medical Card per design.md & context.md Section 5.1 */}
      <div
        id="printable-medical-card"
        className="bg-linear-to-br from-white to-gray-50 rounded-3xl border-2 border-red-500/30 p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h2 className="font-extrabold text-gray-900 text-lg tracking-tight">
                HealthConnect Emergency Medical ID
              </h2>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                Patient UID: {user?.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center px-4 py-2 rounded-2xl bg-red-600 text-white shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-90">Blood Type</span>
              <span className="text-2xl font-black">{bloodGroup || 'Not Set'}</span>
            </div>
          </div>
        </div>

        {/* Card Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs uppercase font-bold text-gray-400">Patient Full Name</p>
            <p className="font-bold text-gray-900 text-base">{user?.name || 'Patient'}</p>
            <p className="text-xs text-gray-500">{phone || 'No phone number added'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase font-bold text-gray-400">Primary Emergency Contact</p>
            {contactName ? (
              <>
                <p className="font-bold text-gray-900 text-base">
                  {contactName} {relationship ? `(${relationship})` : ''}
                </p>
                {contactPhone && (
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <HiOutlinePhone className="w-3.5 h-3.5" />
                    {contactPhone}
                  </a>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400 italic">Not set yet</p>
            )}
          </div>

          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs uppercase font-bold text-red-500 flex items-center gap-1">
              <HiOutlineExclamationCircle className="w-4 h-4" />
              Verified Allergies & Medical Alerts
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {allergiesText
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean).length > 0 ? (
                allergiesText
                  .split(',')
                  .map((a) => a.trim())
                  .filter(Boolean)
                  .map((allergy, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold"
                    >
                      <HiOutlineExclamationCircle className="w-3.5 h-3.5 inline-block mr-0.5" /> {allergy}
                    </span>
                  ))
              ) : (
                <span className="text-xs text-gray-400 italic">No allergies added yet</span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 text-[10px] text-gray-400 flex items-center justify-between">
          <span>In extreme emergencies, call Bangladesh Emergency Service 999.</span>
          <span>Emergency Medical Card</span>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Update Medical Card Info</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Keep your medical details up to date so doctors have accurate info.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-primary"
              >
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Personal Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Verified Medical Allergies (Comma separated)
            </label>
            <input
              type="text"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              placeholder="E.g., Penicillin, Peanuts, Sulfa Drugs"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Relationship
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Contact Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <HiOutlineSave className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
