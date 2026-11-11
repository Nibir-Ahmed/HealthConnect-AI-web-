import React from 'react';

const ChatBubble = ({ message, isUser = false, timestamp }) => {
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} my-2`}>
      <div
        className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${
          isUser
            ? 'bg-[#3b8f72] text-white rounded-br-xs'
            : 'bg-gray-100 text-gray-800 rounded-bl-xs'
        }`}
      >
        {message}
      </div>
      {timestamp && <span className="text-[10px] text-gray-400 mt-1 px-1">{timestamp}</span>}
    </div>
  );
};

export default ChatBubble;
