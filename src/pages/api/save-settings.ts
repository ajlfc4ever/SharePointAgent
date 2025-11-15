import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      instructions, 
      temperature, 
      vadThreshold, 
      prefixPadding, 
      silenceDuration,
      fetchDescription,
      fetchSchema,
      actionDescription,
      actionSchema,
      manageDescription,
      manageSchema,
      enableTextChat,
      textChatModel
    } = body;

    const settingsStore = getStore('assistant-config');
    
    await settingsStore.set('settings', JSON.stringify({
      instructions: instructions || '',
      temperature: temperature !== undefined ? temperature : 0.8,
      vadThreshold: vadThreshold !== undefined ? vadThreshold : 0.5,
      prefixPadding: prefixPadding !== undefined ? prefixPadding : 300,
      silenceDuration: silenceDuration !== undefined ? silenceDuration : 500,
      fetchDescription: fetchDescription || '',
      fetchSchema: fetchSchema || null,
      actionDescription: actionDescription || '',
      actionSchema: actionSchema || null,
      manageDescription: manageDescription || '',
      manageSchema: manageSchema || null,
      enableTextChat: enableTextChat || false,
      textChatModel: textChatModel || 'gpt-4o',
      lastUpdated: new Date().toISOString()
    }));

    return new Response(
      JSON.stringify({ success: true, message: 'Settings saved successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save settings'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
