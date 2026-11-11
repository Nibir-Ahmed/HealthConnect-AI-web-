import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineClipboardList,
  HiOutlinePhone,
  HiOutlinePaperAirplane,
  HiOutlineExclamation,
  HiOutlineUserGroup,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineDocumentAdd,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { evaluateSymptomsWithAI, cleanHumanText } from '../../services/aiTriageService';
import db from '../../services/db';

function humanizeMessageText(raw) {
  if (!raw) return '';
  return cleanHumanText(raw)
    .replace(/^Initial Assessment:\s*/gim, 'Possible Condition: ')
    .replace(/^[•-]\s*Urgency Level:.*$/gim, '')
    .replace(/^[•-]\s*Recommended Specialist:.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const PROMPT_CHIPS = [
  'Amar 2 din dhore matha batha r jor',
  'Chest pain & shortness of breath',
  'Pet kharap r bar bar bomi hocche',
  'High fever with intense joint ache',
  'Severe skin rash with intense itching',
];

const INITIAL_MESSAGES = [
  {
    id: 'msg_welcome',
    sender: 'assistant',
    text: "Hi! Welcome to HealthConnect's Symptom Checker. You can describe how you're feeling in English, Banglish, or Bengali. We'll try to help you understand your symptoms and suggest what to do next. How are you feeling today?",
    time: 'Just now',
    isEmergency: false,
  },
];

const DiagnosisPage = () => {
  const { user } = useAuth();
  const storageKey = `hc_triage_session_${user?.id || 'guest'}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return INITIAL_MESSAGES;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.map((m) => ({
            ...m,
            text: m.sender === 'assistant' ? humanizeMessageText(m.text) : m.text,
          }))
        : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [savedVaultId, setSavedVaultId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // ignore storage errors
    }
    if (messages.some((m) => m.isEmergency)) {
      setEmergencyActive(true);
    }
  }, [messages, storageKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing]);

  const handleSend = async (textToSend = null) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isAnalyzing) return;
    if (messageContent.length > 1000) {
      alert('Message exceeds 1000 characters limit.');
      return;
    }

    const userMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: messageContent,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsAnalyzing(true);

    try {
      // Evaluate using the hybrid Clinical AI Engine (Groq LLM + Clinical KB + Safety Regex)
      const triageResult = await evaluateSymptomsWithAI(messageContent);

      if (triageResult.isEmergency) {
        setEmergencyActive(true);
      }

      const triageMessage = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: triageResult.clinicalAssessment,
        isEmergency: triageResult.isEmergency,
        urgencyLevel: triageResult.urgencyLevel,
        severityScore: triageResult.severityScore,
        matchedConditions: triageResult.matchedConditions || [],
        precautions: triageResult.precautions || [],
        warningSigns: triageResult.warningSigns || [],
        suggestedSpecialty: triageResult.suggestedSpecialty,
        rawSymptomQuery: messageContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, triageMessage]);
    } catch (err) {
      console.error('Triage error:', err);
      const errorMessage = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to check your symptoms at the moment. Please try again or consult a doctor directly.',
        isEmergency: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save symptom check session to Health Records
  const handleSaveToVault = (msg) => {
    try {
      const record = {
        patientId: user?.id,
        patientName: user?.name || 'Patient',
        title: `Symptom Check: ${msg.suggestedSpecialty || 'General'}`,
        category: 'Symptom Assessment',
        date: new Date().toISOString().split('T')[0],
        doctor: 'HealthConnect Care Team',
        facility: 'Online Consultation',
        notes: humanizeMessageText(msg.text),
        urgencyLevel: msg.urgencyLevel,
        suggestedSpecialty: msg.suggestedSpecialty,
        fileType: 'text/summary',
        fileSize: 20480,
        createdAt: new Date().toISOString(),
      };
      db.add('health_records', record);
      setSavedVaultId(msg.id);
      setTimeout(() => setSavedVaultId(null), 3000);
    } catch (err) {
      console.error('Failed to save to vault:', err);
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return {
          bg: 'bg-red-100 text-red-800 border-red-300',
          dot: 'bg-red-500',
          label: 'CRITICAL EMERGENCY (999)',
        };
      case 'Urgent':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          label: 'URGENT MEDICAL ATTENTION',
        };
      case 'Moderate':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          label: 'MODERATE / CLINIC REVIEW',
        };
      case 'Mild':
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'MILD / SUPPORTIVE CARE',
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Pinned Emergency Banner per context.md Section 3.1 & design.md */}
      {emergencyActive && (
        <div className="mb-4 p-4 rounded-2xl bg-red-600 text-white shadow-lg flex items-center justify-between gap-4 animate-bounce-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <HiOutlineExclamation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base">EMERGENCY MEDICAL ALERT</h4>
              <p className="text-xs text-red-100">
                Severe symptoms detected. Please seek emergency medical care immediately.
              </p>
            </div>
          </div>
          <a
            href="tel:999"
            className="px-5 py-2.5 rounded-xl bg-white text-red-700 font-extrabold text-xs sm:text-sm shadow-md hover:bg-red-50 inline-flex items-center gap-1.5 shrink-0"
          >
            <HiOutlinePhone className="w-4 h-4 animate-pulse" />
            <span>DIAL 999</span>
          </a>
        </div>
      )}

      {/* Main Chat Card */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-xs flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <HiOutlineClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Symptom Checker</h3>
              <p className="text-[11px] text-gray-400">Multilingual: English • Banglish • বাংলা</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMessages(INITIAL_MESSAGES);
              setEmergencyActive(false);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 text-xs inline-flex items-center gap-1"
            title="Reset conversation"
          >
            <HiOutlineRefresh className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Prompt Suggestion Chips */}
        <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-gray-400 shrink-0">Try Asking:</span>
          {PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isAnalyzing}
              onClick={() => handleSend(chip)}
              className="px-3 py-1 rounded-full bg-white hover:bg-teal-50 border border-gray-200 text-gray-700 text-xs font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
          {messages.map((msg) => {
            const urgencyBadge = msg.urgencyLevel ? getUrgencyBadge(msg.urgencyLevel) : null;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-2xl p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#2A9D8F] text-white rounded-br-xs shadow-xs'
                      : msg.isEmergency
                      ? 'bg-red-50 border border-red-200 text-red-950 rounded-bl-xs'
                      : 'bg-white border border-gray-200/90 text-gray-800 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {/* Severity Badge for Clinical Responses */}
                  {urgencyBadge && (
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${urgencyBadge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${urgencyBadge.dot}`} />
                        {urgencyBadge.label}
                      </div>

                      {msg.severityScore && (
                        <span className="text-[11px] font-medium text-gray-400">
                          Severity: <strong className="text-gray-700">{msg.severityScore}/7</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Main Clinical Assessment Text */}
                  <div
                    className={`whitespace-pre-line text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user' ? 'text-white font-medium' : 'text-gray-800 font-normal'
                    }`}
                  >
                    {msg.sender === 'assistant' ? humanizeMessageText(msg.text) : msg.text}
                  </div>

                  {/* Differential Diagnoses from Knowledge Base */}
                  {msg.matchedConditions && msg.matchedConditions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Possible Conditions
                      </h5>
                      <div className="space-y-2">
                        {msg.matchedConditions.map((cond, idx) => {
                          const pct =
                            typeof cond.confidence === 'number'
                              ? cond.confidence <= 1
                                ? Math.round(cond.confidence * 100)
                                : Math.round(cond.confidence)
                              : null;
                          return (
                            <div key={idx} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-semibold text-gray-800">
                                  {cond.name} {cond.bengaliName && <span className="text-gray-500 font-normal">({cond.bengaliName})</span>}
                                </span>
                                {pct !== null && (
                                  <span className="font-bold text-[#2A9D8F] text-[11px]">{pct}% Match</span>
                                )}
                              </div>
                              {pct !== null && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-[#2A9D8F] h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Self-Care & Clinical Precautions Checklist */}
                  {msg.precautions && msg.precautions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
                        <HiOutlineShieldCheck className="w-3.5 h-3.5 text-[#2A9D8F]" />
                        Recommended Self-Care & Precautions
                      </h5>
                      <ul className="space-y-1.5 text-xs text-gray-600">
                        {msg.precautions.map((precaution, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <HiOutlineCheckCircle className="w-4 h-4 text-[#2A9D8F] shrink-0 mt-0.5" />
                            <span>{precaution}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warning Signs / Red Flags Checklist */}
                  {msg.warningSigns && msg.warningSigns.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1">
                        <HiOutlineExclamation className="w-3.5 h-3.5 text-amber-500" />
                        Warning Signs to Watch For
                      </h5>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {msg.warningSigns.map((sign, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                            <span>{sign}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Bar: Find Doctor + Save to Vault */}
                  {msg.suggestedSpecialty && !msg.isEmergency && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-400">Recommended Specialty:</span>
                        <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                          {msg.suggestedSpecialty}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Save to Health Records */}
                        <button
                          type="button"
                          onClick={() => handleSaveToVault(msg)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title="Save this to your records"
                        >
                          <HiOutlineDocumentAdd className="w-3.5 h-3.5 text-gray-500" />
                          {savedVaultId === msg.id ? (
                            <span className="text-teal-600 font-bold">Saved!</span>
                          ) : (
                            <span>Save to Records</span>
                          )}
                        </button>

                        {/* Find Doctor in Directory (Nahid's Module Link) */}
                        <Link
                          to={`/patient/doctors?specialty=${encodeURIComponent(msg.suggestedSpecialty)}`}
                          className="px-3 py-1.5 rounded-lg bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <HiOutlineUserGroup className="w-3.5 h-3.5" />
                          <span>Find Doctor</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
              </div>
            );
          })}

          {/* Analyzing / Thinking Indicator */}
          {isAnalyzing && (
            <div className="flex items-start gap-2">
              <div className="p-4 rounded-2xl rounded-bl-xs bg-gray-50 border border-gray-200/60 shadow-xs flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2A9D8F] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#2A9D8F] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#2A9D8F] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  Checking symptoms...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              maxLength={1000}
              disabled={isAnalyzing}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your symptoms in English, Banglish, or বাংলা..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#2A9D8F] transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isAnalyzing}
              className="p-3 bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white rounded-2xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Send symptoms"
            >
              <HiOutlinePaperAirplane className="w-5 h-5 rotate-90" />
            </button>
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            This symptom checker gives general guidance only and is not a substitute for proper medical care. If you're in an emergency, call 999.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisPage;
