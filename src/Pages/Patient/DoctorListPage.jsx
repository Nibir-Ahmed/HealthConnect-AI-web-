import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import db from '../../services/db';
import {
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineClock,
  HiOutlineCurrencyBangladeshi,
} from 'react-icons/hi';

const SPECIALTIES = [
  'All',
  'General Physician',
  'Cardiology',
  'Gastroenterology',
  'Neurology',
  'Pulmonology',
  'Dermatology',
  'Urology',
  'Pediatrics',
  'Family Medicine',
];

const DoctorListPage = () => {
  const [searchParams] = useSearchParams();
  const urlSpecialty = searchParams.get('specialty');
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(urlSpecialty || 'All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (urlSpecialty) {
      setSelectedSpecialty(urlSpecialty);
    }
  }, [urlSpecialty]);

  useEffect(() => {
    // Invariant per context.md Section 3.2: Only verified doctors can be viewed/booked by patients
    return db.subscribe('doctors', (list) => {
      const verifiedOnly = (list || []).filter((doc) => doc.isVerified === true);
      const byKey = new Map();
      for (const doc of verifiedOnly) {
        const key = (doc.email || doc.userId || doc.id || '').toLowerCase();
        if (!byKey.has(key)) byKey.set(key, doc);
      }
      setDoctors(Array.from(byKey.values()));
    });
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpecialty =
      selectedSpecialty === 'All' || doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase();
    const matchesQuery =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesQuery;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Find a Doctor</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Consult qualified and verified doctors across Bangladesh.
        </p>
      </div>

      {/* Search Bar & Specialty Chips */}
      <div className="space-y-3">
        <div className="relative">
          <HiOutlineSearch className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name or specialty..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#2A9D8F] transition-all shadow-xs"
          />
        </div>

        {/* Specialty Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SPECIALTIES.map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedSpecialty === spec
                  ? 'bg-[#2A9D8F] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 mx-auto flex items-center justify-center">
            <HiOutlineSearch className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">No Verified Physicians Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No doctors matched your specialty or search criteria. Try selecting "All" or modifying your search terms.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs hover:shadow-md hover:border-teal-100 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80'}
                      alt={doc.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-gray-100"
                    />
                    {doc.isOnline && (
                      <span
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"
                        title="Physician is currently online"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-gray-900 text-base truncate">{doc.name}</h3>
                      <HiOutlineShieldCheck
                        className="w-4 h-4 text-emerald-600 shrink-0"
                        title="BMDC Verified Practitioner"
                      />
                    </div>
                    <p className="text-xs font-semibold text-[#2A9D8F]">{doc.specialty}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{doc.experience} Years Experience</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {doc.bio}
                </p>

                {/* Rating & Fee Metadata */}
                <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <HiOutlineStar className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{doc.rating?.toFixed(1) || '5.0'}</span>
                    <span className="text-gray-400 font-normal">({doc.reviews || 0})</span>
                  </div>

                  <div className="font-extrabold text-gray-900 flex items-center">
                    <span>৳{doc.consultationFee || 500}</span>
                    <span className="text-[10px] text-gray-400 font-normal ml-1">/ visit</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-gray-50 flex items-center gap-2">
                <Link
                  to={`/patient/doctors/${doc.id}`}
                  className="w-full py-2.5 rounded-xl bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white text-xs font-bold text-center transition-all shadow-xs"
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorListPage;
