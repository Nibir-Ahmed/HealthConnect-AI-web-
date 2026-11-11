import React from 'react';

const TimeSlotPicker = ({ slots = [], selectedSlot, onSelectSlot }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onSelectSlot?.(slot)}
          className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors ${
            selectedSlot === slot
              ? 'bg-[#3b8f72] text-white border-[#3b8f72]'
              : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-500'
          }`}
        >
          {slot}
        </button>
      ))}
    </div>
  );
};

export default TimeSlotPicker;
