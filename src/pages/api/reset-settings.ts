import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    const settingsStore = getStore('assistant-config');
    
    await settingsStore.delete('settings');

    return new Response(
      JSON.stringify({ success: true, message: 'Settings reset successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reset settings'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
