import React, { useState } from 'react';

const ChatInput = ({ onSend, placeholder = 'Type your message...' }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend?.(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-white border-t border-gray-100">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
      />
      <button
        type="submit"
        className="px-4 py-2.5 bg-[#3b8f72] text-white rounded-xl text-sm font-medium hover:bg-[#327a61] transition-colors"
      >
        Send
      </button>
    </form>
  );
};

export default ChatInput;
