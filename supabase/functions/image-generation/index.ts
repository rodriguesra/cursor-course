import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_lib/cors.ts';

// Image generation request interface
interface ImageRequest {
  prompt: string;
  chatId?: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024'; // DALL-E 3 supported sizes
  quality?: 'standard' | 'hd'; // DALL-E 3 quality options
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    console.log('Image generation function invoked');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? ''
    );

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API key available:', !!openaiApiKey);
    
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    let requestData: ImageRequest;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { prompt, chatId, size = '1024x1024', quality = 'standard' } = requestData;
    
    if (!prompt || prompt.trim().length === 0) {
      console.error('Invalid prompt:', prompt);
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Generating image with prompt:', prompt);

    // Save user message to database if chatId provided
    if (chatId) {
      await supabaseClient
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          role: 'user',
          content: prompt,
          type: 'image'
        });
    }

    // Call OpenAI Image Generation API
    const requestBody = {
      model: 'dall-e-3', // Using DALL-E 3 instead of gpt-image-1 for broader compatibility
      prompt: prompt,
      size: size,
      quality: quality,
      response_format: 'b64_json',
      n: 1,
    };

    console.log('Sending request to OpenAI:', JSON.stringify(requestBody, null, 2));

    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: `Image generation failed: ${openaiResponse.status}`,
          details: errorData 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await openaiResponse.json();
    console.log('Image generation successful');

    // Extract the base64 image data
    const imageBase64 = result.data[0].b64_json;
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    // Save assistant message with image to database if chatId provided
    if (chatId) {
      await supabaseClient
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          role: 'assistant',
          content: `Generated image for: "${prompt}"`,
          type: 'image',
          image_url: imageUrl
        });
    }

    // Return the image data
    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: imageUrl,
        prompt: prompt,
        size: size,
        quality: quality
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred during image generation.',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});