import React, { useState, useRef, useEffect } from 'react';
import { Message } from './Message';
import { ChatGPTInput } from './ChatGPTInput';
import { sendChatMessage, generateChatId, generateImage, type ChatMessage as APIChatMessage } from '@/lib/api';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'image';
  imageUrl?: string;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId] = useState<string>(() => generateChatId());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, mode: 'text' | 'image' = 'text') => {
    if (isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
      type: mode,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (mode === 'image') {
        // Handle image generation
        const result = await generateImage({
          prompt: content,
          chatId: chatId,
          quality: 'standard',
          size: '1024x1024'
        });

        // Add assistant message with generated image
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: result.prompt,
          role: 'assistant',
          timestamp: new Date(),
          type: 'image',
          imageUrl: result.imageUrl,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle text chat with streaming
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          content: '',
          role: 'assistant',
          timestamp: new Date(),
          type: 'text',
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Convert to API format
        const apiMessages: APIChatMessage[] = [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        // Send to Edge Function with streaming
        await sendChatMessage(
          apiMessages,
          chatId,
          (chunk: string) => {
            // Update the assistant message with streaming content
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          }
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">ChatGPT</h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-white px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Hello! How can I assist you today?
              </h2>
              <p className="text-gray-500 text-base">
                Try asking a question to get started!
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((message) => (
              <Message
                key={message.id}
                content={message.content}
                role={message.role}
                type={message.type}
                imageUrl={message.imageUrl}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatGPTInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};
