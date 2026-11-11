import React from 'react';

const EmptyState = ({ title = 'No data found', description = 'There are no items to display right now.', actionText, onAction }) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center text-gray-400 mb-3 text-lg">
        ∅
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">{description}</p>
      {actionText && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[#3b8f72] text-white rounded-xl text-xs font-medium hover:bg-[#327a61] transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
