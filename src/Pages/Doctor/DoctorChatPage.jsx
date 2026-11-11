import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import { resolveAvatar } from '../../utils/avatar';
import {
  HiOutlinePaperAirplane,
  HiOutlineDocumentText,
  HiOutlineSearch,
  HiOutlineChatAlt2,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const DoctorChatPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [patientUser, setPatientUser] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
        if (found) {
          setActiveAppointment(found);
          return;
        }
      }
      if (docApts.length > 0) {
        setActiveAppointment((prev) => docApts.find((a) => a.id === prev?.id) || docApts[0]);
      }
    });
  }, [user, doctorProfile?.id, id]);

  // Subscribe to all messages reactively
  useEffect(() => {
    if (!user) return;
    return db.subscribe('messages', (list) => {
      setAllMessages(list || []);
    });
  }, [user]);

  // Group appointments by Patient so each Patient appears as ONE unified thread (like Meta Messenger)
  const patientThreads = useMemo(() => {
    const map = new Map();
    for (const apt of appointments) {
      const key =
        apt.patientId ||
        apt.patientEmail?.toLowerCase() ||
        apt.patientName?.toLowerCase() ||
        apt.id;
      if (!map.has(key)) {
        map.set(key, {
          key,
          primaryAppointment: apt,
          appointmentIds: new Set([apt.id]),
          patientId: apt.patientId,
          patientName: apt.patientName || 'Patient',
          patientAvatar: resolveAvatar(apt.patientAvatar, apt.patientName),
        });
      } else {
        const entry = map.get(key);
        entry.appointmentIds.add(apt.id);
      }
    }

    const threads = Array.from(map.values()).map((thread) => {
      const threadMsgs = allMessages
        .filter(
          (m) =>
            thread.appointmentIds.has(m.appointmentId) ||
            (thread.patientId &&
              (m.patientId === thread.patientId || m.senderId === thread.patientId))
        )
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      const lastMessage = threadMsgs[threadMsgs.length - 1] || null;
      return {
        ...thread,
        messages: threadMsgs,
        lastMessage,
      };
    });

    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter((t) => t.patientName.toLowerCase().includes(q));
  }, [appointments, allMessages, searchQuery]);

  // Active unified thread for selected patient
  const activeThread = useMemo(() => {
    if (!activeAppointment) return patientThreads[0] || null;
    return (
      patientThreads.find((t) => t.appointmentIds.has(activeAppointment.id)) ||
      patientThreads[0] ||
      null
    );
  }, [patientThreads, activeAppointment]);

  const messages = activeThread?.messages || [];

  // Load active patient's info and vault records reactively
  useEffect(() => {
    if (!activeThread) return;
    const patId = activeThread.patientId;
    const unsubUsers = db.subscribe('users', (list) => {
      const pat = (list || []).find((u) => u.id === patId || u.uid === patId);
      setPatientUser(pat || null);
    });
    const unsubRecs = db.subscribe('health_records', (list) => {
      const recs = (list || []).filter((r) => r.patientId === patId);
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
  }, [activeThread, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeThread?.key]);

  const handleSendMessage = () => {
    const text = inputText.trim();
    const targetApt = activeThread?.primaryAppointment || activeAppointment;
    if (!text || !targetApt) return;

    db.add('messages', {
      appointmentId: targetApt.id,
      patientId: targetApt.patientId,
      doctorId: user.id,
      senderId: user.id,
      senderRole: 'doctor',
      senderName: doctorProfile?.name || `Dr. ${user.name}`,
      text,
    });

    setInputText('');
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* Left Sidebar: Meta Messenger Patient Threads */}
      <div className="w-72 border-r border-gray-100 flex flex-col shrink-0 hidden md:flex bg-white">
        <div className="p-4 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900 text-xl tracking-tight">Chats</h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              {patientThreads.length} Patients
            </span>
          </div>

          {/* Messenger Search Pill */}
          <div className="relative">
            <HiOutlineSearch className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-9 pr-4 py-2 bg-[#F0F2F5] rounded-full text-xs text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0084FF]/30 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {patientThreads.length === 0 ? (
            <p className="text-xs text-gray-400 p-6 text-center">No patients in queue.</p>
          ) : (
            patientThreads.map((thread) => {
              const isSelected = activeThread?.key === thread.key;
              const lastMsg = thread.lastMessage;
              const isLastFromMe = lastMsg
                ? lastMsg.senderRole
                  ? lastMsg.senderRole === 'doctor'
                  : lastMsg.senderId === user?.id
                : false;
              const previewText = lastMsg
                ? `${isLastFromMe ? 'You: ' : ''}${
                    lastMsg.text || (lastMsg.attachment ? `Shared ${lastMsg.attachment.title}` : '')
                  }`
                : `${thread.primaryAppointment.date} • ${thread.primaryAppointment.time}`;

              return (
                <button
                  key={thread.key}
                  type="button"
                  onClick={() => setActiveAppointment(thread.primaryAppointment)}
                  className={`w-full p-2.5 rounded-2xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                    isSelected ? 'bg-[#E7F3FF]/70' : 'hover:bg-gray-100/80'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={thread.patientAvatar}
                      alt={thread.patientName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-100"
                    />
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {thread.patientName}
                      </p>
                      {lastMsg?.createdAt && (
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(lastMsg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        !isLastFromMe && lastMsg ? 'font-semibold text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {previewText}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Messenger Stream */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeThread ? (
          <>
            {/* Top Messenger Header */}
            <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={activeThread.patientAvatar}
                    alt={activeThread.patientName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">
                    {activeThread.patientName}
                  </h3>
                  <p className="text-[11px] text-gray-500 truncate">
                    Active now • {activeThread.primaryAppointment.date} ({activeThread.primaryAppointment.time})
                  </p>
                </div>
              </div>

              <Link
                to={`/doctor/prescriptions?appointmentId=${activeThread.primaryAppointment.id}`}
                className="px-4 py-1.5 rounded-full bg-[#0084FF] hover:bg-[#0073E6] text-white text-xs font-bold transition-all shadow-xs"
              >
                Write Rx
              </Link>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-white">
              {/* Patient Profile Intro Banner (Messenger Style) */}
              <div className="text-center py-5 space-y-1.5 border-b border-gray-50 mb-4">
                <img
                  src={activeThread.patientAvatar}
                  alt={activeThread.patientName}
                  className="w-16 h-16 rounded-full object-cover mx-auto shadow-xs border border-gray-100"
                />
                <h4 className="font-bold text-gray-900 text-base">{activeThread.patientName}</h4>
                <p className="text-xs text-gray-500">
                  HealthConnect Patient • Scheduled Consultation
                </p>
              </div>

              {messages.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-11 h-11 rounded-full bg-[#E7F3FF] text-[#0084FF] mx-auto flex items-center justify-center">
                    <HiOutlineChatAlt2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Send diagnostic guidance or follow-up questions to{' '}
                    <span className="font-semibold text-gray-700">{activeThread.patientName}</span>.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSelf = msg.senderRole
                    ? msg.senderRole === 'doctor'
                    : msg.senderId === user?.id;
                  const prevMsg = messages[idx - 1];
                  const prevIsSameSender =
                    prevMsg &&
                    (prevMsg.senderRole
                      ? prevMsg.senderRole === msg.senderRole
                      : prevMsg.senderId === msg.senderId);

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 ${
                        isSelf ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Patient Avatar on Left for Incoming Messages (Meta Messenger style) */}
                      {!isSelf && (
                        <img
                          src={activeThread.patientAvatar}
                          alt={activeThread.patientName}
                          className="w-7 h-7 rounded-full object-cover shrink-0 mb-4 border border-gray-100"
                        />
                      )}

                      <div
                        className={`flex flex-col max-w-[75%] sm:max-w-md ${
                          isSelf ? 'items-end' : 'items-start'
                        }`}
                      >
                        {!isSelf && !prevIsSameSender && (
                          <span className="text-[11px] font-semibold text-gray-500 ml-3 mb-1">
                            {msg.senderName || activeThread.patientName}
                          </span>
                        )}

                        <div
                          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isSelf
                              ? 'bg-gradient-to-r from-[#0084FF] to-[#0099FF] text-white rounded-br-xs shadow-xs'
                              : 'bg-[#F0F2F5] text-gray-900 rounded-bl-xs'
                          }`}
                        >
                          {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}

                          {/* Shared Document Attachment */}
                          {msg.attachment && (
                            <div
                              className={`mt-1.5 p-2.5 rounded-xl border flex items-center gap-2.5 ${
                                isSelf
                                  ? 'bg-white/15 border-white/25 text-white'
                                  : 'bg-white border-gray-200 text-gray-900'
                              }`}
                            >
                              <HiOutlineDocumentText className="w-6 h-6 shrink-0 text-[#0084FF]" />
                              <div className="min-w-0">
                                <p className="font-bold truncate text-xs">{msg.attachment.title}</p>
                                <p className="text-[10px] opacity-85">
                                  {msg.attachment.category} • {msg.attachment.date}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mt-1 px-1">
                          <span className="text-[10px] text-gray-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isSelf && (
                            <HiOutlineCheckCircle className="w-3 h-3 text-[#0084FF]" title="Delivered" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Messenger Composer Bar */}
            <div className="p-3.5 border-t border-gray-100 bg-white">
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
                  placeholder={`Message ${activeThread.patientName}...`}
                  className="flex-1 px-4 py-2.5 bg-[#F0F2F5] rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0084FF]/25 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-9 h-9 flex items-center justify-center bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-full shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  <HiOutlinePaperAirplane className="w-4 h-4 rotate-90 translate-x-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
            <h4 className="font-bold text-gray-800">Select a patient conversation to begin</h4>
          </div>
        )}
      </div>

      {/* Right Drawer: Patient Vault Inspector per context.md Section 5.2 */}
      {activeThread && (
        <div className="w-72 border-l border-gray-100 p-5 bg-gray-50/40 flex flex-col shrink-0 hidden lg:flex space-y-5 overflow-y-auto">
          <div>
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">
              Patient Medical Profile
            </h4>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2.5 text-xs shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Blood Group</span>
                <span className="font-extrabold text-red-600 px-2 py-0.5 rounded-md bg-red-50">
                  {patientUser?.bloodGroup || 'Not set'}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <span className="text-gray-500 block mb-1">Known Allergies:</span>
                <div className="flex flex-wrap gap-1">
                  {patientUser?.allergies?.length > 0 ? (
                    patientUser.allergies.map((allg, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-bold"
                      >
                        {allg}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-gray-400">None reported</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">
              Shared Media & Vault ({patientRecords.length})
            </h4>
            <div className="space-y-2">
              {patientRecords.length === 0 ? (
                <p className="text-xs text-gray-400 bg-white p-4 rounded-2xl border border-gray-200 text-center">
                  No records shared yet.
                </p>
              ) : (
                patientRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-white rounded-2xl border border-gray-200 text-xs shadow-xs space-y-1"
                  >
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
