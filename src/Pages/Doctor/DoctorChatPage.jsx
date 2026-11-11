import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import {
  HiOutlinePaperAirplane,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineFolder,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineChatAlt2,
} from 'react-icons/hi';

const DoctorChatPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [patientUser, setPatientUser] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Load doctor profile reactively
  useEffect(() => {
    if (!user) return;
    return db.subscribe('doctors', (list) => {
      const matches = (list || []).filter(
        (d) =>
          d.id === user.id ||
          d.userId === user.id ||
          (user.email && d.email?.toLowerCase() === user.email.toLowerCase())
      );
      const doc = matches.find((d) => d.isVerified) || matches[0] || null;
      setDoctorProfile(doc);
    });
  }, [user]);

  // Load doctor's appointments
  useEffect(() => {
    if (!user) return;
    return db.subscribe('appointments', (list) => {
      const docApts = (list || []).filter(
        (a) =>
          a.doctorId === user.id ||
          a.doctorDocId === user.id ||
          a.doctorId === doctorProfile?.id ||
          a.doctorDocId === doctorProfile?.id ||
          (user.email && a.doctorEmail?.toLowerCase() === user.email.toLowerCase()) ||
          (user.name && a.doctorName?.toLowerCase().includes(user.name.toLowerCase()))
      );
      setAppointments(docApts);
      if (id) {
        const found = docApts.find((a) => a.id === id);
        setActiveAppointment(found || docApts[0] || null);
      } else if (docApts.length > 0) {
        setActiveAppointment((prev) => docApts.find((a) => a.id === prev?.id) || docApts[0]);
      }
    });
  }, [user, doctorProfile?.id, id]);

  // Load active patient's info and vault records reactively
  useEffect(() => {
    if (!activeAppointment) return;
    const unsubUsers = db.subscribe('users', (list) => {
      const pat = (list || []).find((u) => u.id === activeAppointment.patientId || u.uid === activeAppointment.patientId);
      setPatientUser(pat || null);
    });
    const unsubRecs = db.subscribe('health_records', (list) => {
      const recs = (list || []).filter((r) => r.patientId === activeAppointment.patientId);
      const chatAttachments = (messages || [])
        .filter((m) => m.attachment)
        .map((m) => ({
          id: m.id,
          title: m.attachment.title,
          category: m.attachment.category,
          date: m.attachment.date,
        }));
      const merged = [...recs];
      for (const att of chatAttachments) {
        if (!merged.some((r) => r.title === att.title && r.date === att.date)) {
          merged.push(att);
        }
      }
      setPatientRecords(merged);
    });
    return () => {
      unsubUsers();
      unsubRecs();
    };
  }, [activeAppointment, messages]);

  // Subscribe to channel messages (sorted oldest-to-newest for chat)
  useEffect(() => {
    if (!activeAppointment) return;
    return db.subscribe('messages', (list) => {
      const channelMessages = (list || [])
        .filter((m) => m.appointmentId === activeAppointment.id)
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setMessages(channelMessages);
    });
  }, [activeAppointment]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || !activeAppointment) return;

    db.add('messages', {
      appointmentId: activeAppointment.id,
      senderId: user.id,
      senderRole: 'doctor',
      senderName: doctorProfile?.name || `Dr. ${user.name}`,
      text,
    });

    setInputText('');
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
      {/* Channels List */}
      <div className="w-64 border-r border-gray-100 flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">Consultation Channels</h3>
          <p className="text-[11px] text-gray-400">Scheduled patients</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {appointments.length === 0 ? (
            <p className="text-xs text-gray-400 p-4 text-center">No patients in queue.</p>
          ) : (
            appointments.map((apt) => (
              <button
                key={apt.id}
                type="button"
                onClick={() => setActiveAppointment(apt)}
                className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                  activeAppointment?.id === apt.id
                    ? 'bg-[#2A9D8F]/10 text-gray-900 border border-teal-100'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <img
                  src={
                    apt.patientAvatar ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={apt.patientName}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{apt.patientName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{apt.date} • {apt.time}</p>
                  <span
                    className={`text-[9px] font-bold uppercase ${
                      apt.status === 'upcoming' ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeAppointment ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={
                    activeAppointment.patientAvatar ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={activeAppointment.patientName}
                  className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">
                    {activeAppointment.patientName}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Consultation #{activeAppointment.id.slice(-5)} • {activeAppointment.time}
                  </p>
                </div>
              </div>

              <Link
                to={`/doctor/prescriptions?appointmentId=${activeAppointment.id}`}
                className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
              >
                Write Rx
              </Link>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gray-50/30">
              {messages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-[#2A9D8F] mx-auto flex items-center justify-center">
                    <HiOutlineChatAlt2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">Consultation Channel Active</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Type below to send diagnostic advice or inquiry to {activeAppointment.patientName}.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelf = msg.senderRole === 'doctor' || msg.senderId === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isSelf
                            ? 'bg-[#2A9D8F] text-white rounded-br-xs shadow-xs'
                            : 'bg-white border border-gray-100 text-gray-900 rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}

                        {/* Shared Document Attachment */}
                        {msg.attachment && (
                          <div
                            className={`mt-2 p-3 rounded-xl border flex items-center gap-2.5 ${
                              isSelf
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-900'
                            }`}
                          >
                            <HiOutlineDocumentText className="w-6 h-6 shrink-0 text-[#2A9D8F]" />
                            <div className="min-w-0">
                              <p className="font-bold truncate text-xs">{msg.attachment.title}</p>
                              <p className="text-[10px] opacity-80">
                                {msg.attachment.category} • {msg.attachment.date}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  maxLength={1000}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Send medical response to ${activeAppointment.patientName}...`}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#2A9D8F] transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white rounded-2xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <HiOutlinePaperAirplane className="w-5 h-5 rotate-90" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
            <h4 className="font-bold text-gray-800">Select an active patient to begin consultation</h4>
          </div>
        )}
      </div>

      {/* Right Drawer: Patient Vault Inspector per context.md Section 5.2 */}
      {activeAppointment && (
        <div className="w-72 border-l border-gray-100 p-5 bg-gray-50/40 flex flex-col shrink-0 hidden lg:flex space-y-5 overflow-y-auto">
          <div>
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">
              Patient Medical Profile
            </h4>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2.5 text-xs shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Blood Group</span>
                <span className="font-extrabold text-red-600 px-2 py-0.5 rounded-md bg-red-50">
                  {patientUser?.bloodGroup || 'B+'}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <span className="text-gray-500 block mb-1">Known Allergies:</span>
                <div className="flex flex-wrap gap-1">
                  {(patientUser?.allergies || ['Penicillin', 'Peanuts']).map((allg, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-bold">
                      {allg}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">
              Shared Vault Documents ({patientRecords.length})
            </h4>
            <div className="space-y-2">
              {patientRecords.length === 0 ? (
                <p className="text-xs text-gray-400 bg-white p-4 rounded-2xl border border-gray-200 text-center">
                  No records uploaded by patient.
                </p>
              ) : (
                patientRecords.map((rec) => (
                  <div key={rec.id} className="p-3 bg-white rounded-2xl border border-gray-200 text-xs shadow-xs space-y-1">
                    <p className="font-bold text-gray-900 truncate">{rec.title}</p>
                    <p className="text-[10px] text-gray-400">
                      {rec.category} • {rec.date}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorChatPage;
