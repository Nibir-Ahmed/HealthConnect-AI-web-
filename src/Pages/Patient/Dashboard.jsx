import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import {
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlinePhone,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from 'react-icons/hi';
import { resolveAvatar } from '../../utils/avatar';

const Dashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [records, setRecords] = useState([]);
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubApt = db.subscribe('appointments', (list) => {
      setAppointments((list || []).filter((a) => a.patientId === user.id));
    });
    const unsubRx = db.subscribe('prescriptions', (list) => {
      setPrescriptions((list || []).filter((p) => p.patientId === user.id));
    });
    const unsubRec = db.subscribe('health_records', (list) => {
      setRecords((list || []).filter((r) => r.patientId === user.id));
    });
    const unsubBlog = db.subscribe('blogs', (list) => {
      setBlogs(list || []);
    });

    return () => {
      unsubApt();
      unsubRx();
      unsubRec();
      unsubBlog();
    };
  }, [user]);

  const upcomingAppointments = appointments.filter((a) => a.status === 'upcoming');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#2A9D8F] to-[#1E7A6E] rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            Patient Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good day, {user?.name || 'Patient'}
          </h1>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Check your symptoms, connect with certified doctors, or view your medical records anytime.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            to="/patient/diagnosis"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-[#1E7A6E] font-bold text-sm shadow-md hover:bg-emerald-50 transition-all active:scale-[0.98]"
          >
            <HiOutlineClipboardList className="w-5 h-5 text-[#2A9D8F]" />
            <span>Symptom Checker</span>
          </Link>
          <a
            href="tel:999"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <HiOutlinePhone className="w-5 h-5" />
            <span>Emergency 999</span>
          </a>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upcoming Visits</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{upcomingAppointments.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#2A9D8F] flex items-center justify-center text-xl">
            <HiOutlineCalendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Digital Prescriptions</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{prescriptions.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <HiOutlineDocumentText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vault Documents</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{records.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            <HiOutlineFolder className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Consultations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Appointments</h2>
            <Link to="/patient/appointments" className="text-xs font-semibold text-[#2A9D8F] hover:underline flex items-center gap-1">
              View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 mx-auto flex items-center justify-center">
                <HiOutlineCalendar className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900">No Upcoming Appointments</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Need to speak with a physician? Browse our verified specialists and reserve a time slot.
              </p>
              <Link
                to="/patient/doctors"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2A9D8F] text-white text-xs font-bold hover:bg-[#1E7A6E] transition-all"
              >
                Browse Doctors
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:border-gray-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={resolveAvatar(apt.doctorAvatar, apt.doctorName)}
                      alt={apt.doctorName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-100"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{apt.doctorName}</h4>
                      <p className="text-xs text-[#2A9D8F] font-medium">{apt.doctorSpecialty}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                        <span className="flex items-center gap-1"><HiOutlineCalendar className="w-3.5 h-3.5" /> {apt.date}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><HiOutlineClock className="w-3.5 h-3.5" /> {apt.time}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                      Confirmed
                    </span>
                    <Link
                      to={`/patient/chat/${apt.id}`}
                      className="px-3.5 py-2 rounded-xl bg-[#2A9D8F] text-white text-xs font-bold hover:bg-[#1E7A6E] transition-colors"
                    >
                      Join Chat
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Health Advice Articles */}
          <div className="pt-2">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Health & Wellness Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {blogs.slice(0, 2).map((blog) => (
                <div key={blog.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
                  <img src={blog.image} alt={blog.title} className="w-full h-32 object-cover" />
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                      {blog.category}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{blog.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{blog.content}</p>
                    <p className="text-[11px] text-gray-400 pt-1">By {blog.author} • {blog.readTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Emergency Profile Snapshot */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Emergency Medical Card</h3>
              <Link to="/patient/profile" className="text-xs font-semibold text-[#2A9D8F] hover:underline">
                Export PDF
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Blood Group</span>
                <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 font-extrabold text-sm">
                  {user?.bloodGroup || 'Not specified'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-gray-50">
                <span className="text-gray-500 font-medium">Known Allergies</span>
                <span className="text-gray-800 font-medium text-right">
                  {user?.allergies && user.allergies.length > 0 ? user.allergies.join(', ') : 'None reported'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-gray-50">
                <span className="text-gray-500 font-medium">Emergency Contact</span>
                <span className="text-gray-800 font-medium text-right">
                  {user?.emergencyContact?.name ? `${user.emergencyContact.name} (${user.emergencyContact.relationship || 'Contact'})` : 'Not provided'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-gray-50">
                <span className="text-gray-500 font-medium">Contact Phone</span>
                {user?.emergencyContact?.phone ? (
                  <a
                    href={`tel:${user.emergencyContact.phone}`}
                    className="text-[#2A9D8F] font-bold hover:underline"
                  >
                    {user.emergencyContact.phone}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </div>
            </div>

            <Link
              to="/patient/profile"
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold text-center block transition-all"
            >
              View Full Emergency Card
            </Link>
          </div>

          {/* Clinical Disclaimer */}
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-4 text-[11px] text-amber-900 leading-relaxed space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <HiOutlineCheckCircle className="w-4 h-4 text-amber-600" />
              Safety Notice
            </p>
            <p>
              HealthConnect helps you check symptoms and talk to doctors online. In emergencies, call 999 or go to the nearest hospital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
