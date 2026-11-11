import React from 'react';

const SymptomChip = ({ label, onRemove, selected = false, onClick }) => {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
        selected
          ? 'bg-[#3b8f72] text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-75 focus:outline-none ml-0.5"
        >
          ×
        </button>
      )}
    </span>
  );
};

export default SymptomChip;
