import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { openaiKey, openaiModel, voice, fetchUrl, actionUrl, manageUrl } = body;

    if (!openaiKey || !openaiModel || !voice || !fetchUrl || !actionUrl || !manageUrl) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const configStore = getStore('assistant-config');
    
    const existingConfigJson = await configStore.get('config');
    let configHistory: Array<{ timestamp: string, action: string }> = [];
    
    if (existingConfigJson) {
      try {
        const existingConfig = JSON.parse(existingConfigJson);
        configHistory = existingConfig.configHistory || [];
      } catch (e) {
        console.error('Failed to parse existing config history:', e);
      }
    }
    
    configHistory.push({
      timestamp: new Date().toISOString(),
      action: existingConfigJson ? 'updated' : 'created'
    });
    
    if (configHistory.length > 10) {
      configHistory = configHistory.slice(-10);
    }
    
    await configStore.set('config', JSON.stringify({
      openaiKey,
      openaiModel,
      voice,
      fetchUrl,
      actionUrl,
      manageUrl,
      setupComplete: true,
      lastUpdated: new Date().toISOString(),
      configHistory
    }));

    return new Response(
      JSON.stringify({ success: true, message: 'Configuration saved successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save configuration'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async () => {
  try {
    const configStore = getStore('assistant-config');
    const configJson = await configStore.get('config');
    
    if (!configJson) {
      return new Response(
        JSON.stringify({ exists: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = JSON.parse(configJson);
    
    return new Response(
      JSON.stringify({
        exists: true,
        setupComplete: config.setupComplete || false
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
