import React from 'react';

interface MessageProps {
  content: string;
  role: 'user' | 'assistant';
  type?: 'text' | 'image';
  imageUrl?: string;
}

export const Message: React.FC<MessageProps> = ({ content, role, type = 'text', imageUrl }) => {
  const isUser = role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex items-start space-x-3 max-w-[75%] ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-green-600 text-white'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>
        
        {/* Message Content */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-blue-600 text-white rounded-br-sm' 
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}>
          {type === 'image' && imageUrl ? (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed">{content}</p>
              <div className="rounded-lg overflow-hidden bg-white">
                <img 
                  src={imageUrl} 
                  alt={content}
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxWidth: '300px', maxHeight: '300px' }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
};
