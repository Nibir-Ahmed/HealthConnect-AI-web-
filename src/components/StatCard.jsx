import React from 'react';

const StatCard = ({ title, value, change, icon: Icon, color = 'emerald' }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</span>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {change && <p className="text-xs text-gray-500 mt-1">{change}</p>}
    </div>
  );
};

export default StatCard;
