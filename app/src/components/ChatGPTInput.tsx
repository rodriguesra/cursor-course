import React, { useState, useRef, useEffect } from 'react';

interface ChatGPTInputProps {
  onSendMessage: (message: string, mode: 'text' | 'image') => void;
  disabled?: boolean;
}

export const ChatGPTInput: React.FC<ChatGPTInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'text' | 'image'>('text');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), selectedMode);
      setMessage('');
      setSelectedMode('text'); // Reset to text mode after sending
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const selectMode = (mode: 'text' | 'image') => {
    setSelectedMode(mode);
    setShowDropdown(false);
  };

  const getPlaceholder = () => {
    if (selectedMode === 'image') {
      return 'Describe an image...';
    }
    return 'Message ChatGPT...';
  };

  const getModeDisplay = () => {
    if (selectedMode === 'image') {
      return (
        <div className="flex items-center text-blue-600">
          <span className="text-sm">🎨 Image</span>
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border-t border-gray-200 bg-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Mode indicator */}
        {selectedMode === 'image' && (
          <div className="mb-2 flex items-center justify-between">
            {getModeDisplay()}
            <button
              onClick={() => setSelectedMode('text')}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-end space-x-3 relative">
          {/* Plus button with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 focus:outline-none"
              disabled={disabled}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute bottom-full mb-2 left-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  type="button"
                  onClick={() => selectMode('image')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Create image</div>
                    <div className="text-gray-500 text-xs">Generate an image from text</div>
                  </div>
                  {selectedMode === 'image' && (
                    <div className="ml-auto">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>

                <div className="border-t border-gray-100 my-1"></div>

                <div className="px-4 py-2">
                  <div className="text-xs text-gray-500">More features coming soon...</div>
                </div>
              </div>
            )}
          </div>

          {/* Text input */}
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholder()}
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

          {/* Send button */}
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
