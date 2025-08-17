import React, { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  mode?: 'text' | 'image';
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false, mode = 'text' }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-6">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={mode === 'text' ? "Message ChatGPT..." : "Describe the image you want to generate..."}
              disabled={disabled}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0 disabled:bg-gray-50 disabled:text-gray-500 shadow-sm"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '120px',
                overflowY: message.length > 50 ? 'auto' : 'hidden'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-400 transition-colors hover:bg-gray-300 focus:outline-none disabled:bg-gray-200 disabled:cursor-not-allowed enabled:hover:bg-gray-300"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
