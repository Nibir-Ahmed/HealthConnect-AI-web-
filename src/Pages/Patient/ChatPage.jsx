import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import { resolveAvatar } from '../../utils/avatar';
import {
  HiOutlinePaperAirplane,
  HiOutlinePaperClip,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineChatAlt2,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const ChatPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
        if (found) {
          setActiveAppointment(found);
          return;
        }
      }
      if (userApts.length > 0) {
        setActiveAppointment((prev) => userApts.find((a) => a.id === prev?.id) || userApts[0]);
      }
    });
  }, [user, id]);

  // Subscribe to all messages so we can show unified threads + sidebar previews like Meta Messenger
  useEffect(() => {
    if (!user) return;
    return db.subscribe('messages', (list) => {
      setAllMessages(list || []);
    });
  }, [user]);

  // Load vault records for attachment
  useEffect(() => {
    if (!user) return;
    return db.subscribe('health_records', (list) => {
      setUserRecords((list || []).filter((r) => r.patientId === user.id));
    });
  }, [user]);

  // Group appointments by Doctor so each Doctor appears as ONE unified conversation thread (like Meta Messenger)
  const doctorThreads = useMemo(() => {
    const map = new Map();
    for (const apt of appointments) {
      const key =
        apt.doctorId ||
        apt.doctorDocId ||
        apt.doctorEmail?.toLowerCase() ||
        apt.doctorName?.toLowerCase() ||
        apt.id;
      if (!map.has(key)) {
        map.set(key, {
          key,
          primaryAppointment: apt,
          appointmentIds: new Set([apt.id]),
          doctorId: apt.doctorId || apt.doctorDocId,
          doctorName: apt.doctorName || 'Doctor',
          doctorSpecialty: apt.doctorSpecialty || 'General Physician',
          doctorAvatar: resolveAvatar(apt.doctorAvatar, apt.doctorName),
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
            (m.patientId === user?.id &&
              thread.doctorId &&
              (m.doctorId === thread.doctorId || m.senderId === thread.doctorId))
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
    return threads.filter(
      (t) =>
        t.doctorName.toLowerCase().includes(q) ||
        t.doctorSpecialty.toLowerCase().includes(q)
    );
  }, [appointments, allMessages, user?.id, searchQuery]);

  // Find active unified thread for the selected doctor
  const activeThread = useMemo(() => {
    if (!activeAppointment) return doctorThreads[0] || null;
    return (
      doctorThreads.find((t) => t.appointmentIds.has(activeAppointment.id)) ||
      doctorThreads[0] ||
      null
    );
  }, [doctorThreads, activeAppointment]);

  const messages = activeThread?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeThread?.key]);

  const handleSendMessage = (attachment = null) => {
    const text = inputText.trim();
    if (!text && !attachment) return;
    const targetApt = activeThread?.primaryAppointment || activeAppointment;
    if (!targetApt) return;

    db.add('messages', {
      appointmentId: targetApt.id,
      patientId: user.id,
      doctorId: targetApt.doctorId || targetApt.doctorDocId,
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
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* Left Sidebar: Meta Messenger Contacts List */}
      <div className="w-80 border-r border-gray-100 flex flex-col shrink-0 hidden sm:flex bg-white">
        <div className="p-4 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900 text-xl tracking-tight">Chats</h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              {doctorThreads.length} Active
            </span>
          </div>

          {/* Messenger Search Pill */}
          <div className="relative">
            <HiOutlineSearch className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Messenger..."
              className="w-full pl-9 pr-4 py-2 bg-[#F0F2F5] rounded-full text-xs text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0084FF]/30 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {doctorThreads.length === 0 ? (
            <p className="text-xs text-gray-400 p-6 text-center">No active conversations yet.</p>
          ) : (
            doctorThreads.map((thread) => {
              const isSelected = activeThread?.key === thread.key;
              const lastMsg = thread.lastMessage;
              const isLastFromMe = lastMsg
                ? lastMsg.senderRole
                  ? lastMsg.senderRole === 'patient'
                  : lastMsg.senderId === user?.id
                : false;
              const previewText = lastMsg
                ? `${isLastFromMe ? 'You: ' : ''}${
                    lastMsg.text || (lastMsg.attachment ? `Shared ${lastMsg.attachment.title}` : '')
                  }`
                : `${thread.doctorSpecialty} • Tap to chat`;

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
                      src={thread.doctorAvatar}
                      alt={thread.doctorName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-100"
                    />
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {thread.doctorName}
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
                    src={activeThread.doctorAvatar}
                    alt={activeThread.doctorName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900 text-sm truncate">
                      {activeThread.doctorName}
                    </h3>
                    <HiOutlineShieldCheck className="w-4 h-4 text-[#0084FF] shrink-0" />
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    Active now • {activeThread.doctorSpecialty}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#F0F2F5] text-gray-700">
                  {activeThread.primaryAppointment.date} • {activeThread.primaryAppointment.time}
                </span>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-white">
              {/* Doctor Profile Intro Banner (Messenger Style) */}
              <div className="text-center py-6 space-y-1.5 border-b border-gray-50 mb-4">
                <img
                  src={activeThread.doctorAvatar}
                  alt={activeThread.doctorName}
                  className="w-16 h-16 rounded-full object-cover mx-auto shadow-xs border border-gray-100"
                />
                <h4 className="font-bold text-gray-900 text-base">{activeThread.doctorName}</h4>
                <p className="text-xs text-gray-500">
                  {activeThread.doctorSpecialty} • Verified HealthConnect Physician
                </p>
              </div>

              {messages.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-11 h-11 rounded-full bg-[#E7F3FF] text-[#0084FF] mx-auto flex items-center justify-center">
                    <HiOutlineChatAlt2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Say hello or share a lab report from your Health Vault to start your consultation with{' '}
                    <span className="font-semibold text-gray-700">{activeThread.doctorName}</span>.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSelf = msg.senderRole
                    ? msg.senderRole === 'patient'
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
                      {/* Doctor Avatar on Left for Incoming Messages (Meta Messenger style) */}
                      {!isSelf && (
                        <img
                          src={activeThread.doctorAvatar}
                          alt={activeThread.doctorName}
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
                            {msg.senderName || activeThread.doctorName}
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

                          {/* Attachment Card */}
                          {msg.attachment && (
                            <div
                              className={`mt-1.5 p-2.5 rounded-xl border flex items-center gap-2.5 ${
                                isSelf
                                  ? 'bg-white/15 border-white/25 text-white'
                                  : 'bg-white border-gray-200 text-gray-900'
                              }`}
                            >
                              <HiOutlineDocumentText className="w-6 h-6 shrink-0" />
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
                <button
                  type="button"
                  onClick={() => setVaultModalOpen(true)}
                  className="w-9 h-9 flex items-center justify-center text-[#0084FF] hover:bg-[#E7F3FF] rounded-full transition-colors cursor-pointer shrink-0"
                  title="Attach document from Health Vault"
                >
                  <HiOutlinePaperClip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  maxLength={1000}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Aa"
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <h3 className="font-bold text-gray-800">Select a conversation to start chatting</h3>
            <p className="text-xs text-gray-500">
              Book an appointment with a verified doctor to open a consultation thread.
            </p>
            <Link
              to="/patient/doctors"
              className="px-4 py-2 rounded-full bg-[#0084FF] text-white text-xs font-bold"
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
                    className="p-3 rounded-2xl border border-gray-200 hover:border-[#0084FF] hover:bg-[#E7F3FF]/40 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <HiOutlineDocumentText className="w-5 h-5 text-[#0084FF] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{rec.title}</p>
                        <p className="text-[10px] text-gray-400">
                          {rec.category} • {rec.date}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#0084FF] px-2.5 py-1 rounded-full bg-white border border-blue-100">
                      Send
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
