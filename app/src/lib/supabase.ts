import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database schema
export interface ChatSession {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  created_at: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  image_url?: string;
}
