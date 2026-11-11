import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineChatAlt2,
  HiOutlineXCircle,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { resolveAvatar } from '../../utils/avatar';

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (!user) return;
    return db.subscribe('appointments', (list) => {
      const userAppointments = (list || []).filter((apt) => apt.patientId === user.id);
      setAppointments(userAppointments);
    });
  }, [user]);

  const handleCancel = (appointmentId) => {
    const confirmed = window.confirm(
      'Are you sure you wish to cancel this appointment? This action will free your reserved consultation slot.'
    );
    if (confirmed) {
      db.update('appointments', appointmentId, { status: 'cancelled' });
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'upcoming') return apt.status === 'upcoming';
    if (activeTab === 'completed') return apt.status === 'completed';
    if (activeTab === 'cancelled') return apt.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Appointments</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track upcoming consultations, past prescriptions, and physician chat channels.
          </p>
        </div>
        <Link
          to="/patient/doctors"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white text-xs font-bold transition-all shadow-xs"
        >
          + Book New Consultation
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        {['upcoming', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab} (
            {
              appointments.filter((a) =>
                tab === 'upcoming'
                  ? a.status === 'upcoming'
                  : tab === 'completed'
                  ? a.status === 'completed'
                  : a.status === 'cancelled'
              ).length
            }
            )
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 mx-auto flex items-center justify-center">
            <HiOutlineCalendar className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">No {activeTab} appointments</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You do not have any appointments in the '{activeTab}' category.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs hover:border-gray-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                <img
                  src={resolveAvatar(apt.doctorAvatar, apt.doctorName)}
                  alt={apt.doctorName}
                  className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shrink-0"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{apt.doctorName}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        apt.status === 'upcoming'
                          ? 'bg-amber-50 text-amber-700'
                          : apt.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#2A9D8F]">{apt.doctorSpecialty}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <HiOutlineCalendar className="w-4 h-4 text-gray-400" /> {apt.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <HiOutlineClock className="w-4 h-4 text-gray-400" /> {apt.time}
                    </span>
                    <span>•</span>
                    <span className="font-extrabold text-gray-800">৳{apt.fee}</span>
                  </div>

                  {apt.notes && (
                    <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl mt-2 max-w-lg">
                      <span className="font-bold text-gray-700">Patient Notes:</span> {apt.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                <Link
                  to={`/patient/chat/${apt.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <HiOutlineChatAlt2 className="w-4 h-4" />
                  <span>Consultation Chat</span>
                </Link>

                {apt.status === 'upcoming' && (
                  <button
                    type="button"
                    onClick={() => handleCancel(apt.id)}
                    className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                    title="Cancel consultation"
                  >
                    <HiOutlineXCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
