import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlinePrinter,
} from 'react-icons/hi';

const PrescriptionPage = () => {
  const [searchParams] = useSearchParams();
  const appointmentIdFromUrl = searchParams.get('appointmentId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(appointmentIdFromUrl || '');
  const [pastPrescriptions, setPastPrescriptions] = useState([]);

  // Form State
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '1-0-1', duration: '5 days' },
  ]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load doctor profile & appointments reactively
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
      setSelectedAppointmentId((prev) => prev || (docApts.length > 0 ? docApts[0].id : ''));
    });

    const unsubRx = db.subscribe('prescriptions', (list) => {
      const docRx = (list || []).filter(
        (p) => p.doctorId === user.id || (currentDoc && p.doctorId === currentDoc.id)
      );
      setPastPrescriptions(docRx);
    });

    return () => {
      unsubDoc();
      unsubApts();
      unsubRx();
    };
  }, [user]);

  const addMedicationRow = () => {
    setMedications((prev) => [
      ...prev,
      { name: '', dosage: '', frequency: '1-0-1', duration: '5 days' },
    ]);
  };

  const removeMedicationRow = (index) => {
    if (medications.length <= 1) return;
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedChange = (index, field, value) => {
    setMedications((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Invariant per context.md Section 3.1: Medications array strictly typed containing non-empty strings
    if (medications.length === 0) {
      setError('Please add at least one medication regimen.');
      return;
    }

    for (const med of medications) {
      if (!med.name.trim() || !med.dosage.trim() || !med.frequency.trim() || !med.duration.trim()) {
        setError('All medication fields (Name, Dosage, Frequency, Duration) must be non-empty.');
        return;
      }
    }

    const currentApt = appointments.find((a) => a.id === selectedAppointmentId);
    if (!currentApt) {
      setError('Please associate this prescription with an active patient appointment.');
      return;
    }

    // Commit to prescriptions collection
    db.add('prescriptions', {
      patientId: currentApt.patientId,
      patientName: currentApt.patientName,
      appointmentId: currentApt.id,
      doctorId: doctorProfile?.id || user.id,
      doctor: {
        id: doctorProfile?.id || user.id,
        name: doctorProfile?.name || `Dr. ${user.name}`,
        specialty: doctorProfile?.specialty || 'General Practitioner',
      },
      medications,
      notes: notes.trim(),
    });

    // Mark appointment as completed per design.md Section 3 Step 2
    db.update('appointments', currentApt.id, { status: 'completed' });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setMedications([{ name: '', dosage: '', frequency: '1-0-1', duration: '5 days' }]);
      setNotes('');
    }, 2000);
  };

  const currentAppointment = appointments.find((a) => a.id === selectedAppointmentId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Write Prescription</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Add medicines, dosage instructions, and advice for the patient.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
          <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
          Prescription created and sent successfully!
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Prescription Authoring Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Patient Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
            Select Patient Consultation
          </label>
          <select
            value={selectedAppointmentId}
            onChange={(e) => setSelectedAppointmentId(e.target.value)}
            required
            className="w-full sm:max-w-md px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2A9D8F]"
          >
            {appointments.map((apt) => (
              <option key={apt.id} value={apt.id}>
                {apt.patientName} — {apt.date} at {apt.time} ({apt.status})
              </option>
            ))}
          </select>
        </div>

        {/* Medication Table Rows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
              Prescribed Medications
            </label>
            <button
              type="button"
              onClick={addMedicationRow}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#2A9D8F] hover:underline cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" /> Add Medication
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((med, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-4">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                    Drug Name *
                  </label>
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                    placeholder="E.g., Paracetamol, Amoxicillin"
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                    placeholder="500mg"
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                    Regimen Schedule *
                  </label>
                  <input
                    type="text"
                    value={med.frequency}
                    onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                    placeholder="1-0-1 after meal"
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                    Duration *
                  </label>
                  <input
                    type="text"
                    value={med.duration}
                    onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                    placeholder="5 days"
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeMedicationRow(idx)}
                    disabled={medications.length <= 1}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-xl disabled:opacity-30 cursor-pointer"
                    title="Remove item"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advice / Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
            Medical Advice & Instructions
          </label>
          <textarea
            rows={3}
            value={notes}
            maxLength={800}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g., Drink at least 2.5 liters of fluids daily. Avoid cold drinks. Review symptoms in 5 days if fever persists."
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#2A9D8F]"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <HiOutlineDocumentText className="w-4 h-4" />
            <span>Issue & Sign Prescription</span>
          </button>
        </div>
      </form>

      {/* Previously Issued Prescriptions */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-gray-900">Recently Authored Prescriptions ({pastPrescriptions.length})</h2>
        {pastPrescriptions.length === 0 ? (
          <p className="text-xs text-gray-400 bg-white p-6 rounded-3xl border border-gray-100 text-center">
            No digital prescriptions have been issued yet.
          </p>
        ) : (
          <div className="space-y-3">
            {pastPrescriptions.map((rx) => (
              <div key={rx.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Patient: {rx.patientName}</h4>
                    <p className="text-[10px] text-gray-400">
                      Prescription #{rx.id} • Issued {new Date(rx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Committed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {rx.medications.map((m, i) => (
                    <div key={i} className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="font-bold text-gray-800">{m.name}</span> ({m.dosage}) —{' '}
                      <span className="text-gray-500">{m.frequency} for {m.duration}</span>
                    </div>
                  ))}
                </div>

                {rx.notes && (
                  <p className="text-xs text-gray-500 italic bg-teal-50/40 p-2.5 rounded-xl border border-teal-100/50">
                    Advice: {rx.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionPage;
