import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Supabase Connection', () => {
  it('should connect to Supabase and verify schema', async () => {
    // Test connection by querying system tables
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .limit(1);

    // Should not error even if no data
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should be able to insert and retrieve a chat session', async () => {
    // Insert a test chat session
    const { data: sessionData, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        title: 'Test Chat Session'
      })
      .select()
      .single();

    expect(sessionError).toBeNull();
    expect(sessionData).toBeDefined();
    expect(sessionData?.title).toBe('Test Chat Session');

    if (sessionData) {
      // Insert a test message
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: sessionData.id,
          role: 'user',
          content: 'Hello, world!',
          type: 'text'
        })
        .select()
        .single();

      expect(messageError).toBeNull();
      expect(messageData).toBeDefined();
      expect(messageData?.content).toBe('Hello, world!');

      // Clean up - delete test data
      await supabase.from('chat_sessions').delete().eq('id', sessionData.id);
    }
  });
});
