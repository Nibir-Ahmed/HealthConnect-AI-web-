import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-xs w-fit">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
    </div>
  );
};

export default TypingIndicator;
