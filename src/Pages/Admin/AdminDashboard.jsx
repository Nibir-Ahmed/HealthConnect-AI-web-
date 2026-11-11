import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import db from '../../services/db';
import {
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineCalendar,
  HiOutlineNewspaper,
  HiOutlineCog,
  HiOutlineExclamation,
  HiOutlineArrowRight,
} from 'react-icons/hi';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const unsubUsers = db.subscribe('users', (list) => setUsers(list || []));
    const unsubDocs = db.subscribe('doctors', (list) => setDoctors(list || []));
    const unsubApts = db.subscribe('appointments', (list) => setAppointments(list || []));
    const unsubConfig = db.subscribe('system_config', (c) => setConfig(c || db.get('system_config')));

    return () => {
      unsubUsers();
      unsubDocs();
      unsubApts();
      unsubConfig();
    };
  }, []);

  const patients = users.filter((u) => u.role === 'patient');
  const pendingDoctors = doctors.filter((d) => !d.isVerified);
  const verifiedDoctors = doctors.filter((d) => d.isVerified);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Maintenance Mode Alert Banner */}
      {config?.maintenanceMode && (
        <div className="p-4 rounded-2xl bg-red-600 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl"><HiOutlineExclamation className="w-6 h-6" /></span>
            <div>
              <p className="font-extrabold text-sm">System Maintenance Mode is Currently ACTIVE</p>
              <p className="text-xs text-red-100">
                All patient and doctor client routes are locked out. Only administrators have access.
              </p>
            </div>
          </div>
          <Link
            to="/admin/settings"
            className="px-3.5 py-1.5 rounded-xl bg-white text-red-700 text-xs font-extrabold hover:bg-red-50"
          >
            Manage Config
          </Link>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Administration Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Overview</h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Review doctor verifications, manage users, publish health articles, and monitor platform settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/verifications"
            className="px-5 py-2.5 rounded-2xl bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white font-bold text-xs shadow-md transition-all"
          >
            Verify Doctors ({pendingDoctors.length})
          </Link>
          <Link
            to="/admin/settings"
            className="px-4 py-2.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-all"
          >
            System Config
          </Link>
        </div>
      </div>

      {/* 4-Metric Grid per design.md Section 3 Step 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Patients</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{patients.length}</h3>
            <p className="text-[11px] text-gray-500 mt-1">Registered clients</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#2A9D8F] flex items-center justify-center text-xl">
            <HiOutlineUsers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Doctors</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{doctors.length}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">{verifiedDoctors.length} Active Verified</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <HiOutlineUserGroup className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Audits</p>
            <h3 className="text-3xl font-extrabold text-amber-600 mt-1">{pendingDoctors.length}</h3>
            <p className="text-[11px] text-amber-700 font-medium mt-1">Awaiting BMDC verification</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            <HiOutlineShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Appointments</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{appointments.length}</h3>
            <p className="text-[11px] text-gray-500 mt-1">Platform-wide sessions</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            <HiOutlineCalendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pending Doctor Audits Snapshot */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Urgent Doctor License Audits</h2>
            {pendingDoctors.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                {pendingDoctors.length} action required
              </span>
            )}
          </div>
          <Link to="/admin/verifications" className="text-xs font-semibold text-[#2A9D8F] hover:underline flex items-center gap-1">
            Review all <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingDoctors.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center space-y-2">
            <p className="font-semibold text-gray-800 text-sm">All Physician Licenses Fully Audited</p>
            <p className="text-xs text-gray-500">There are no pending doctor applications awaiting audit.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl border border-amber-200/70 p-5 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={doc.avatar || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=200&q=80'}
                    alt={doc.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-gray-100"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{doc.name}</h4>
                    <p className="text-xs text-[#2A9D8F] font-medium">{doc.specialty}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                      BMDC: {doc.bmdcNumber || 'Not provided'}
                    </p>
                  </div>
                </div>

                <Link
                  to="/admin/verifications"
                  className="px-4 py-2 rounded-xl bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white text-xs font-bold transition-all shadow-xs shrink-0"
                >
                  Audit License
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
