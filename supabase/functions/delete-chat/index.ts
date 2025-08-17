import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_lib/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('Delete chat function invoked');
    
    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
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

    // Parse request body
    const requestData = await req.json();
    const { chatId } = requestData;

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: 'Chat ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Deleting chat:', chatId);

    // First, verify the chat exists
    const { data: existingChat, error: chatCheckError } = await supabaseClient
      .from('chat_sessions')
      .select('id, title')
      .eq('id', chatId)
      .single();

    if (chatCheckError || !existingChat) {
      console.error('Chat not found:', chatCheckError);
      return new Response(
        JSON.stringify({ error: 'Chat not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Delete the chat session (messages will be deleted automatically due to CASCADE)
    const { error: deleteError } = await supabaseClient
      .from('chat_sessions')
      .delete()
      .eq('id', chatId);

    if (deleteError) {
      console.error('Error deleting chat:', deleteError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete chat',
          details: deleteError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Successfully deleted chat: ${existingChat.title} (${chatId})`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Chat deleted successfully',
        deletedChat: existingChat
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in delete-chat function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
