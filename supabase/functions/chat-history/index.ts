import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_lib/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('Chat history function invoked');
    
    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase Anon Key available:', !!supabaseAnonKey);

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch chat sessions ordered by most recent
    console.log('Fetching chat sessions...');
    const { data: sessions, error: sessionsError } = await supabaseClient
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50); // Limit to 50 most recent chats

    if (sessionsError) {
      console.error('Error fetching chat sessions:', sessionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch chat sessions' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${sessions?.length || 0} chat sessions`);

    // For each session, we could optionally fetch the first message to use as a preview
    // But for now, we'll just return the sessions with their titles
    const chats = sessions || [];

    return new Response(
      JSON.stringify({ 
        chats,
        count: chats.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in chat-history function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
