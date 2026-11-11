import React from 'react';

const DiagnosticReport = ({ report }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {report?.condition || 'Health Report'}
      </h3>
      <p className="text-sm text-gray-600 mb-4">{report?.summary || 'Report summary.'}</p>
    </div>
  );
};

export default DiagnosticReport;
