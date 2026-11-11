import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import {
  HiOutlinePaperAirplane,
  HiOutlinePaperClip,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineArrowLeft,
  HiOutlineX,
  HiOutlineChatAlt2,
} from 'react-icons/hi';

const ChatPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [userRecords, setUserRecords] = useState([]);
  const messagesEndRef = useRef(null);

  // Subscribe to user appointments
  useEffect(() => {
    if (!user) return;
    return db.subscribe('appointments', (list) => {
      const userApts = (list || []).filter((a) => a.patientId === user.id);
      setAppointments(userApts);
      if (id) {
        const found = userApts.find((a) => a.id === id);
        setActiveAppointment(found || userApts[0] || null);
      } else if (userApts.length > 0) {
        setActiveAppointment(userApts[0]);
      }
    });
  }, [user, id]);

  // Subscribe to messages for the active appointment (sorted oldest-to-newest for chat)
  useEffect(() => {
    if (!activeAppointment) return;
    return db.subscribe('messages', (list) => {
      const channelMessages = (list || [])
        .filter((m) => m.appointmentId === activeAppointment.id)
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setMessages(channelMessages);
    });
  }, [activeAppointment]);

  // Load vault records for attachment
  useEffect(() => {
    if (!user) return;
    return db.subscribe('health_records', (list) => {
      setUserRecords((list || []).filter((r) => r.patientId === user.id));
    });
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (attachment = null) => {
    const text = inputText.trim();
    if (!text && !attachment) return;
    if (!activeAppointment) return;

    db.add('messages', {
      appointmentId: activeAppointment.id,
      senderId: user.id,
      senderRole: 'patient',
      senderName: user.name || 'Patient',
      text,
      attachment,
    });

    setInputText('');
  };

  const handleAttachRecord = (record) => {
    handleSendMessage({
      title: record.title,
      category: record.category,
      date: record.date,
    });
    setVaultModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
      {/* Left Channel Sidebar */}
      <div className="w-72 border-r border-gray-100 flex flex-col shrink-0 hidden sm:flex">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">Consultation Channels</h3>
          <p className="text-[11px] text-gray-400">Active physician sessions</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {appointments.length === 0 ? (
            <p className="text-xs text-gray-400 p-4 text-center">No active appointment channels.</p>
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
                    apt.doctorAvatar ||
                    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={apt.doctorName}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{apt.doctorName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{apt.doctorSpecialty}</p>
                  <p className="text-[9px] text-[#2A9D8F] font-semibold">{apt.date} • {apt.time}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeAppointment ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={
                    activeAppointment.doctorAvatar ||
                    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={activeAppointment.doctorName}
                  className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900 text-sm truncate">
                      {activeAppointment.doctorName}
                    </h3>
                    <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online • {activeAppointment.doctorSpecialty}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-[#2A9D8F]">
                  Appt #{activeAppointment.id.slice(-5)}
                </span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gray-50/30">
              {messages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-[#2A9D8F] mx-auto flex items-center justify-center">
                    <HiOutlineChatAlt2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">Consultation Channel Open</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Send a message or attach a health document to begin consultation with {activeAppointment.doctorName}.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelf = msg.senderId === user.id;
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

                        {/* Attachment Card */}
                        {msg.attachment && (
                          <div
                            className={`mt-2 p-3 rounded-xl border flex items-center gap-2.5 ${
                              isSelf
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-900'
                            }`}
                          >
                            <HiOutlineDocumentText className="w-6 h-6 shrink-0" />
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

            {/* Input Bar with Vault Attachment Button */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => setVaultModalOpen(true)}
                  className="p-3 text-gray-500 hover:text-[#2A9D8F] hover:bg-teal-50 rounded-2xl border border-gray-200 transition-colors cursor-pointer"
                  title="Attach document from Health Vault"
                >
                  <HiOutlinePaperClip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  maxLength={1000}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Type a message to ${activeAppointment.doctorName}...`}
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <h3 className="font-bold text-gray-800">Select an appointment channel to chat</h3>
            <p className="text-xs text-gray-500">
              You need an active appointment to start chatting with your doctor.
            </p>
            <Link
              to="/patient/doctors"
              className="px-4 py-2 rounded-xl bg-[#2A9D8F] text-white text-xs font-bold"
            >
              Find a Doctor
            </Link>
          </div>
        )}
      </div>

      {/* Health Vault Document Selector Modal */}
      {vaultModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Select Document to Share</h3>
              <button
                type="button"
                onClick={() => setVaultModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {userRecords.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  No documents found in your Health Vault.
                </p>
              ) : (
                userRecords.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => handleAttachRecord(rec)}
                    className="p-3 rounded-2xl border border-gray-200 hover:border-[#2A9D8F] hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <HiOutlineDocumentText className="w-5 h-5 text-[#2A9D8F] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{rec.title}</p>
                        <p className="text-[10px] text-gray-400">
                          {rec.category} • {rec.date}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#2A9D8F] px-2 py-1 rounded-lg bg-white border border-teal-100">
                      Share
                    </span>
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

export default ChatPage;
