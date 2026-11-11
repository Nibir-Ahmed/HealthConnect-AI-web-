import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import {
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCurrencyBangladeshi,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { resolveAvatar } from '../../utils/avatar';

const DoctorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to tomorrow's date
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    return db.subscribe('doctors', (list) => {
      const docData = (list || []).find((d) => d.id === id || d.userId === id);
      if (docData) {
        setDoctor(docData);
        setSelectedSlot((prev) =>
          prev || (docData.availability && docData.availability.length > 0 ? docData.availability[0] : '09:00 AM')
        );
      }
    });
  }, [id]);

  if (!doctor) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Doctor Profile Not Found</h2>
        <p className="text-xs text-gray-500">The physician you requested is unavailable or has not been verified.</p>
        <Link
          to="/patient/doctors"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>
    );
  }

  const handleBooking = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDate) {
      setError('Please select an appointment date.');
      return;
    }
    if (!selectedSlot) {
      setError('Please choose an available consultation time slot.');
      return;
    }

    // Invariant per context.md Section 3.1: Duplicate bookings for identical timestamps are rejected
    const existing = db.list(
      'appointments',
      (apt) =>
        apt.patientId === user.id &&
        apt.doctorId === doctor.id &&
        apt.date === selectedDate &&
        apt.time === selectedSlot &&
        apt.status !== 'cancelled'
    );

    if (existing.length > 0) {
      setError('You already have a reserved appointment with this doctor at the exact same date and time.');
      return;
    }

    // Create appointment
    db.add('appointments', {
      patientId: user.id,
      patientName: user.name || 'Patient',
      patientAvatar: user.avatar || '',
      doctorId: doctor.userId || doctor.id,
      doctorDocId: doctor.id,
      doctorEmail: doctor.email || '',
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorAvatar: doctor.avatar,
      date: selectedDate,
      time: selectedSlot,
      status: 'upcoming',
      fee: doctor.consultationFee || 500,
      notes: notes.trim(),
    });

    setBookingSuccess(true);
    navigate('/patient/appointments');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/patient/doctors"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to Directory
      </Link>

      {/* Doctor Overview Card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-6 items-start">
        <img
          src={resolveAvatar(doctor.avatar, doctor.name)}
          alt={doctor.name}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border border-gray-100 shadow-xs shrink-0"
        />

        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">{doctor.name}</h1>
                <HiOutlineShieldCheck className="w-5 h-5 text-emerald-600" title="Verified Practitioner" />
              </div>
              <p className="text-sm font-semibold text-primary">{doctor.specialty}</p>
            </div>

            <div className="text-right">
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900">৳{doctor.consultationFee}</span>
              <p className="text-[11px] text-gray-400">Consultation Fee</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1 font-bold text-amber-500">
              <HiOutlineStar className="w-4 h-4 fill-amber-400 text-amber-400" />
              {doctor.rating?.toFixed(1) || '5.0'} ({doctor.reviews || 0} reviews)
            </span>
            <span>•</span>
            <span>{doctor.experience} Years Experience</span>
            {doctor.bmdcNumber && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono text-[11px]">
                  BMDC: {doctor.bmdcNumber}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Booking Form Card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Book an Appointment</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Pick a date and choose a time slot that works for you.
          </p>
        </div>

        {bookingSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
            Appointment successfully scheduled! Redirecting to your appointments...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleBooking} className="space-y-6">
          {/* Date Picker using native platform date input per rung 4 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Select Appointment Date
            </label>
            <input
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="w-full sm:max-w-xs px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-primary"
            />
          </div>

          {/* Time Slot Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Available Slots ({doctor.availability?.length || 0})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(doctor.availability || ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']).map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes / Symptoms Intake */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Reason for Visit / Symptoms (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Experiencing elevated blood pressure and slight dizziness in mornings..."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-primary transition-all"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Locked Consultation Total</p>
              <p className="text-xl font-extrabold text-gray-900">৳{doctor.consultationFee}</p>
            </div>

            <button
              type="submit"
              disabled={bookingSuccess}
              className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              Confirm Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfilePage;
