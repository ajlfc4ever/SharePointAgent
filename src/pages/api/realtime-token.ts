import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    const configStore = getStore('assistant-config');
    const configJson = await configStore.get('config');
    
    console.log('Realtime token - configJson exists:', !!configJson);
    
    if (!configJson) {
      return new Response(
        JSON.stringify({ error: 'Configuration not found. Please complete setup first.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    let config;
    try {
      config = JSON.parse(configJson);
      console.log('Realtime token - config parsed successfully');
    } catch (parseError) {
      console.error('Realtime token - JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid configuration format',
          message: parseError instanceof Error ? parseError.message : 'Failed to parse config'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create an ephemeral token for the client to use with the Realtime API
    const voiceToUse = config.voice || 'alloy';
    console.log('Realtime token - Returning configuration', {
      hasApiKey: !!config.openaiKey,
      model: config.openaiModel || 'gpt-4o-realtime-preview',
      voice: voiceToUse,
      voiceFromConfig: config.voice,
      voiceFallback: !config.voice ? 'alloy (fallback)' : 'from config'
    });
    
    return new Response(
      JSON.stringify({
        apiKey: config.openaiKey,
        model: config.openaiModel || 'gpt-4o-realtime-preview',
        voice: voiceToUse,
        config: {
          fetchUrl: config.fetchUrl,
          actionUrl: config.actionUrl,
          manageUrl: config.manageUrl
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate'
        } 
      }
    );
  } catch (error) {
    console.error('Token generation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate token',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
