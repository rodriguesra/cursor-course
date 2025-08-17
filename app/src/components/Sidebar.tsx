import React, { useState, useEffect } from 'react';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SidebarProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  isLoading?: boolean;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentChatId, 
  onChatSelect, 
  onNewChat, 
  isLoading = false,
  refreshTrigger = 0
}) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [fetchingChats, setFetchingChats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const fetchChatHistory = async () => {
    try {
      setFetchingChats(true);
      setError(null);
      
      // This will use a new Edge Function we'll create
      const response = await fetch(`https://qjizmyhbmkbreyhpevnb.supabase.co/functions/v1/chat-history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqaXpteWhibWticmV5aHBldm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDkyNzksImV4cCI6MjA3MTAyNTI3OX0.TvX-pYeU-v8wtvhPP2wD0FItiT384FtYrX2IvLadJrI`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.status}`);
      }

      const data = await response.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chat history');
    } finally {
      setFetchingChats(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [refreshTrigger]); // Refresh when trigger changes

  const LoadingSkeleton = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-12 bg-gray-100 rounded-lg"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-64 border-r border-gray-200 bg-gray-50 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <button
          onClick={onNewChat}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
          Recent Chats
        </h3>
        
        {fetchingChats ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="p-2">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={fetchChatHistory}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No chat history yet</p>
            <p className="text-gray-400 text-xs mt-1">Start a conversation to see it here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors group ${
                  currentChatId === chat.id
                    ? 'bg-blue-100 border border-blue-200'
                    : 'hover:bg-white border border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                    currentChatId === chat.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      currentChatId === chat.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {chat.title}
                    </p>
                    <p className={`text-xs truncate ${
                      currentChatId === chat.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {formatDate(chat.updated_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="p-2 border-t border-gray-200 bg-white">
        <button
          onClick={fetchChatHistory}
          disabled={fetchingChats}
          className="w-full text-xs text-gray-500 hover:text-gray-700 py-2 transition-colors disabled:opacity-50"
        >
          {fetchingChats ? 'Refreshing...' : 'Refresh History'}
        </button>
      </div>
    </div>
  );
};
