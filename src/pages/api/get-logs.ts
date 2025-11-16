import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const logStore = getStore('voice-chat-logs');
    
    // List all log entries
    const { blobs } = await logStore.list();
    
    // Fetch all logs
    const logs = await Promise.all(
      blobs.map(async (blob) => {
        const data = await logStore.get(blob.key, { type: 'json' });
        return data;
      })
    );
    
    // Sort by timestamp (most recent first)
    logs.sort((a: any, b: any) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    return new Response(
      JSON.stringify({ 
        logs,
        count: logs.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get logs error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
