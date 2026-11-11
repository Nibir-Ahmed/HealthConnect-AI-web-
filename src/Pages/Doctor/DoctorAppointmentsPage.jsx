import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineChatAlt2,
  HiOutlineDocumentText,
  HiOutlineCheck,
  HiOutlineX,
} from 'react-icons/hi';
import { resolveAvatar } from '../../utils/avatar';

const DoctorAppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    let currentDoc = null;

    const unsubDoc = db.subscribe('doctors', (list) => {
      const matches = (list || []).filter(
        (d) =>
          d.id === user.id ||
          d.userId === user.id ||
          (user.email && d.email?.toLowerCase() === user.email.toLowerCase())
      );
      currentDoc = matches.find((d) => d.isVerified) || matches[0] || null;
      setDoctorProfile(currentDoc);
    });

    const unsubApts = db.subscribe('appointments', (list) => {
      const docApts = (list || []).filter(
        (a) =>
          a.doctorId === user.id ||
          a.doctorDocId === user.id ||
          (currentDoc && (a.doctorId === currentDoc.id || a.doctorDocId === currentDoc.id)) ||
          (user.email && a.doctorEmail?.toLowerCase() === user.email.toLowerCase()) ||
          (user.name && a.doctorName?.toLowerCase().includes(user.name.toLowerCase()))
      );
      setAppointments(docApts);
    });

    return () => {
      unsubDoc();
      unsubApts();
    };
  }, [user]);

  const handleStatusChange = (appointmentId, newStatus) => {
    const actionName = newStatus === 'completed' ? 'mark as completed' : 'cancel';
    const confirmed = window.confirm(`Are you sure you want to ${actionName} this consultation?`);
    if (confirmed) {
      db.update('appointments', appointmentId, { status: newStatus });
    }
  };

  const filteredAppointments = appointments.filter((apt) => apt.status === activeTab);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Patient Appointment Queue</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your appointments, start consultations with patients, and write prescriptions.
        </p>
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
                ? 'bg-primary/10 text-primary'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab} (
            {appointments.filter((a) => a.status === tab).length}
            )
          </button>
        ))}
      </div>

      {/* Queue List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 mx-auto flex items-center justify-center">
            <HiOutlineCalendar className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">No {activeTab} Appointments</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            There are currently no patient consultations in the '{activeTab}' queue.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                <img
                  src={resolveAvatar(apt.patientAvatar, apt.patientName)}
                  alt={apt.patientName}
                  className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shrink-0"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{apt.patientName}</h3>
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

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <HiOutlineCalendar className="w-4 h-4 text-gray-400" /> {apt.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <HiOutlineClock className="w-4 h-4 text-gray-400" /> {apt.time}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-gray-900">৳{apt.fee}</span>
                  </div>

                  {apt.notes && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl mt-2 max-w-md">
                      <span className="font-bold text-gray-700">Patient Symptoms:</span> {apt.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                <Link
                  to={`/doctor/chat/${apt.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-xs"
                >
                  <HiOutlineChatAlt2 className="w-4 h-4" />
                  <span>Join Chat</span>
                </Link>

                <Link
                  to={`/doctor/prescriptions?appointmentId=${apt.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
                >
                  <HiOutlineDocumentText className="w-4 h-4" />
                  <span>Write Rx</span>
                </Link>

                {apt.status === 'upcoming' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(apt.id, 'completed')}
                      className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer"
                      title="Mark consultation completed"
                    >
                      <HiOutlineCheck className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(apt.id, 'cancelled')}
                      className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer"
                      title="Cancel consultation"
                    >
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentsPage;
