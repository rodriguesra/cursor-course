// API utilities for chat functionality

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamingResponse {
  content: string;
}

// Use the deployed Supabase Edge Function URL
// For local functions, use: http://127.0.0.1:54321/functions/v1
const SUPABASE_FUNCTIONS_URL = 'https://qjizmyhbmkbreyhpevnb.supabase.co/functions/v1';

export async function sendChatMessage(
  messages: ChatMessage[],
  chatId?: string,
  onChunk?: (content: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqaXpteWhibWticmV5aHBldm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDkyNzksImV4cCI6MjA3MTAyNTI3OX0.TvX-pYeU-v8wtvhPP2wD0FItiT384FtYrX2IvLadJrI`,
      },
      body: JSON.stringify({
        messages,
        chatId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data.trim() === '') continue;

          try {
            const parsed: StreamingResponse = JSON.parse(data);
            if (parsed.content && onChunk) {
              onChunk(parsed.content);
            }
          } catch (parseError) {
            // Skip invalid JSON chunks
            continue;
          }
        }
      }
    }
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}

// Generate a simple chat ID for demo purposes
export function generateChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Image generation interfaces
export interface ImageGenerationRequest {
  prompt: string;
  chatId?: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl: string;
  prompt: string;
  size: string;
  quality: string;
}

// Generate an image using OpenAI's gpt-image-1 model
export async function generateImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/image-generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqaXpteWhibWticmV5aHBldm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDkyNzksImV4cCI6MjA3MTAyNTI3OX0.TvX-pYeU-v8wtvhPP2wD0FItiT384FtYrX2IvLadJrI`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result: ImageGenerationResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Image generation API error:', error);
    throw error;
  }
}

// Load chat interfaces
export interface LoadChatRequest {
  chatId: string;
}

export interface LoadChatResponse {
  success: boolean;
  session: {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
  };
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type: 'text' | 'image';
    image_url?: string;
    created_at: string;
  }>;
}

// Load a specific chat's messages
export async function loadChat(chatId: string): Promise<LoadChatResponse> {
  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/load-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqaXpteWhibWticmV5aHBldm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDkyNzksImV4cCI6MjA3MTAyNTI3OX0.TvX-pYeU-v8wtvhPP2wD0FItiT384FtYrX2IvLadJrI`,
      },
      body: JSON.stringify({ chatId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result: LoadChatResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Load chat API error:', error);
    throw error;
  }
}

// Create chat interfaces
export interface CreateChatRequest {
  title?: string;
}

export interface CreateChatResponse {
  success: boolean;
  chatId: string;
  session: {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
  };
}

// Create a new chat session
export async function createChat(title?: string): Promise<CreateChatResponse> {
  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqaXpteWhibWticmV5aHBldm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDkyNzksImV4cCI6MjA3MTAyNTI3OX0.TvX-pYeU-v8wtvhPP2wD0FItiT384FtYrX2IvLadJrI`,
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result: CreateChatResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Create chat API error:', error);
    throw error;
  }
}
