import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const configStore = getStore('assistant-config');
    const configJson = await configStore.get('config');
    
    if (!configJson) {
      return new Response(
        JSON.stringify({ error: 'Configuration not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = JSON.parse(configJson);
    
    return new Response(
      JSON.stringify({
        openaiKey: config.openaiKey,
        openaiModel: config.openaiModel,
        voice: config.voice || 'alloy',
        fetchUrl: config.fetchUrl,
        actionUrl: config.actionUrl,
        manageUrl: config.manageUrl,
        lastUpdated: config.lastUpdated,
        configHistory: config.configHistory || []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
