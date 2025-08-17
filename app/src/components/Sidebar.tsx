import React, { useState, useEffect, useRef } from 'react';
import { updateChat, deleteChat } from '@/lib/api';

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
  onChatDeleted?: (chatId: string) => void; // Callback when chat is deleted
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentChatId, 
  onChatSelect, 
  onNewChat, 
  isLoading = false,
  refreshTrigger = 0,
  onChatDeleted
}) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [fetchingChats, setFetchingChats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEditStart = (chat: ChatSession) => {
    setEditingId(chat.id);
    setEditingTitle(chat.title);
    setOpenMenuId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleEditSave = async (chatId: string) => {
    if (!editingTitle.trim()) {
      handleEditCancel();
      return;
    }

    try {
      await updateChat(chatId, editingTitle.trim());
      
      // Update local state
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, title: editingTitle.trim(), updated_at: new Date().toISOString() }
          : chat
      ));
      
      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Failed to update chat:', error);
      setError('Failed to update chat name');
    }
  };

  const handleDeleteConfirm = async (chatId: string) => {
    try {
      await deleteChat(chatId);
      
      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // Notify parent if this was the current chat
      if (currentChatId === chatId && onChatDeleted) {
        onChatDeleted(chatId);
      }
      
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete chat:', error);
      setError('Failed to delete chat');
    }
  };

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
              <div key={chat.id} className="relative group">
                {editingId === chat.id ? (
                  // Edit mode
                  <div className="p-3 bg-white border border-blue-200 rounded-lg">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleEditSave(chat.id);
                        } else if (e.key === 'Escape') {
                          handleEditCancel();
                        }
                      }}
                      onBlur={() => handleEditSave(chat.id)}
                      autoFocus
                      className="w-full text-sm font-medium bg-transparent border-none outline-none resize-none"
                      maxLength={100}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        Press Enter to save, Esc to cancel
                      </p>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditSave(chat.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Normal mode
                  <div className="flex items-center">
                    <button
                      onClick={() => onChatSelect(chat.id)}
                      className={`flex-1 text-left p-3 rounded-lg transition-colors ${
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
                    
                    {/* Three-dot menu */}
                    <div className="relative" ref={openMenuId === chat.id ? menuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      {/* Dropdown menu */}
                      {openMenuId === chat.id && (
                        <div className="absolute right-0 top-0 mt-6 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEditStart(chat)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Rename</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(chat.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Delete confirmation modal */}
                {showDeleteConfirm === chat.id && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Delete Chat
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Are you sure you want to delete "{chat.title}"? This action cannot be undone.
                      </p>
                      <div className="flex space-x-3 justify-end">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(chat.id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
