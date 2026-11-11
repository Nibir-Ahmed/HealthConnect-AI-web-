import React from 'react';

const SeverityBanner = ({ severity = 'moderate', message }) => {
  const styles = {
    low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    moderate: 'bg-amber-50 text-amber-800 border-amber-200',
    high: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <div className={`p-4 rounded-2xl border text-sm font-medium ${styles[severity] || styles.moderate}`}>
      {message || `Urgency Level: ${severity.toUpperCase()}`}
    </div>
  );
};

export default SeverityBanner;
