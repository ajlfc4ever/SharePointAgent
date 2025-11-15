import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const settingsStore = getStore('assistant-config');
    const settingsJson = await settingsStore.get('settings');
    
    if (!settingsJson) {
      return new Response(
        JSON.stringify({ exists: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const settings = JSON.parse(settingsJson);
    
    return new Response(
      JSON.stringify({
        exists: true,
        ...settings
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
