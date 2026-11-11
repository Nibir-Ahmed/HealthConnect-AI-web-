import React from 'react';

const DocumentCard = ({ document }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#2A9D8F] font-semibold text-xs">
          PDF
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{document?.title || 'Medical Record'}</h4>
          <p className="text-xs text-gray-400">{document?.date || 'Uploaded recently'}</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
