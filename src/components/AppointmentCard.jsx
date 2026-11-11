import React from 'react';

const AppointmentCard = ({ appointment }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">{appointment?.doctorName || 'Doctor Appointment'}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{appointment?.date || 'Upcoming'}</p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
          {appointment?.status || 'Confirmed'}
        </span>
      </div>
    </div>
  );
};

export default AppointmentCard;
