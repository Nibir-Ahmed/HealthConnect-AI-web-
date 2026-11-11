import React from 'react';

const DoctorCard = ({ doctor }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 text-lg">
          {doctor?.name?.charAt(0) || 'D'}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{doctor?.name || 'Dr. Specialist'}</h3>
          <p className="text-xs text-gray-500">{doctor?.specialty || 'General Physician'}</p>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
