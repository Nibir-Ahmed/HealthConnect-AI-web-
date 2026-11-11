import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import {
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineCurrencyBangladeshi,
  HiOutlineChatAlt2,
  HiOutlineDocumentText,
  HiOutlineExclamation,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
} from 'react-icons/hi';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Load or subscribe to doctor profile (prefer verified or exact UID match)
    const unsubDoc = db.subscribe('doctors', (list) => {
      const matches = (list || []).filter(
        (d) =>
          d.id === user.id ||
          d.userId === user.id ||
          (user.email && d.email?.toLowerCase() === user.email.toLowerCase())
      );
      const profile =
        matches.find((d) => d.isVerified) ||
        matches.find((d) => d.id === user.id || d.userId === user.id) ||
        matches[0] ||
        null;
      if (profile) {
        setDoctorProfile(profile);
      } else if (user.role === 'doctor') {
        // Auto-create missing doctor profile in doctors collection
        const cleanName = (user.name || 'Doctor').trim();
        const seeded = db.update('doctors', user.id, {
          id: user.id,
          userId: user.id,
          name: cleanName.startsWith('Dr.') ? cleanName : `Dr. ${cleanName}`,
          email: user.email || '',
          specialty: user.specialty || 'General Physician',
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2A9D8F&color=fff`,
          experience: Number(user.experience) || 1,
          rating: 5.0,
          reviews: 0,
          consultationFee: Number(user.consultationFee) || 500,
          bio: user.bio || 'Qualified medical practitioner on HealthConnect.',
          isVerified: false,
          isOnline: true,
          availability: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
          bmdcNumber: user.bmdcNumber || '',
          createdAt: user.createdAt || new Date().toISOString(),
        });
        setDoctorProfile(seeded);
      }
    });

    const unsubApts = db.subscribe('appointments', (list) => {
      setAppointments(
        (list || []).filter(
          (a) =>
            a.doctorId === user.id ||
            a.doctorDocId === user.id ||
            (doctorProfile && (a.doctorId === doctorProfile.id || a.doctorDocId === doctorProfile.id)) ||
            (user.email && a.doctorEmail?.toLowerCase() === user.email.toLowerCase()) ||
            (user.name && a.doctorName?.toLowerCase().includes(user.name.toLowerCase()))
        )
      );
    });

    const unsubRx = db.subscribe('prescriptions', (list) => {
      setPrescriptions(
        (list || []).filter(
          (p) => p.doctorId === user.id || (doctorProfile && p.doctorId === doctorProfile.id)
        )
      );
    });

    return () => {
      unsubDoc();
      unsubApts();
      unsubRx();
    };
  }, [user, doctorProfile?.id]);

  const upcomingAppointments = appointments.filter((a) => a.status === 'upcoming');
  const completedAppointments = appointments.filter((a) => a.status === 'completed');
  const totalRevenue = completedAppointments.reduce((acc, curr) => acc + (curr.fee || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Verification Status Banner per design.md Section 3 Step 2 */}
      {doctorProfile && !doctorProfile.isVerified && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3.5 shadow-xs">
          <HiOutlineExclamation className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm">Practitioner License Under Review</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Your credentials (BMDC: {doctorProfile.bmdcNumber || 'Pending verification'}) are currently being audited by Platform Administration. Your profile will be listed in the public directory once verified.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs">
            {doctorProfile?.isVerified ? (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <HiOutlineShieldCheck className="w-4 h-4" /> BMDC Verified Practitioner
              </span>
            ) : (
              <span className="text-amber-300">Verification Pending</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {doctorProfile?.name || `Dr. ${user?.name}`}
          </h1>
          <p className="text-emerald-100 text-sm">
            {doctorProfile?.specialty || 'General Practitioner'} {doctorProfile?.experience ? `• ${doctorProfile.experience} Years Experience` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/doctor/settings"
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
          >
            Availability & Fee
          </Link>
          <Link
            to="/doctor/appointments"
            className="px-5 py-2.5 rounded-2xl bg-white text-teal-900 font-extrabold text-xs shadow-md hover:bg-emerald-50 transition-all"
          >
            Review Patient Queue
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Queue Ahead</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{upcomingAppointments.length}</h3>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Pending Consultations</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed Visits</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{completedAppointments.length}</h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Total treated</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued Prescriptions</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{prescriptions.length}</h3>
          <p className="text-[11px] text-blue-600 font-medium mt-1">Rx records</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Earned Revenue</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">৳{totalRevenue}</h3>
          <p className="text-[11px] text-gray-400 font-medium mt-1">Settled consultations</p>
        </div>
      </div>

      {/* Upcoming Consultations Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Immediate Consultation Queue</h2>
          <Link to="/doctor/appointments" className="text-xs font-semibold text-[#2A9D8F] hover:underline flex items-center gap-1">
            Full queue <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center space-y-2">
            <p className="font-semibold text-gray-800 text-sm">No Patients Waiting in Queue</p>
            <p className="text-xs text-gray-500">
              New patient bookings for your selected availability hours will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={apt.patientAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                    alt={apt.patientName}
                    className="w-12 h-12 rounded-full object-cover border border-gray-100"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{apt.patientName}</h4>
                    <p className="text-xs text-gray-500">
                      Scheduled: <span className="font-medium text-gray-800">{apt.date} at {apt.time}</span>
                    </p>
                    {apt.notes && (
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                        Symptom: {apt.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    to={`/doctor/chat/${apt.id}`}
                    className="px-3.5 py-2 rounded-xl bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Open Consultation Chat
                  </Link>
                  <Link
                    to={`/doctor/prescriptions?appointmentId=${apt.id}`}
                    className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Write Prescription
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
