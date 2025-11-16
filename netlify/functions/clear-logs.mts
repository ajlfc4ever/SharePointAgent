import { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const logStore = getStore('voice-chat-logs');
    
    // List all log entries
    const { blobs } = await logStore.list();
    
    // Delete all logs
    await Promise.all(
      blobs.map(async (blob) => {
        await logStore.delete(blob.key);
      })
    );
    
    return new Response(
      JSON.stringify({ 
        success: true,
        deletedCount: blobs.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Clear logs error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to clear logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config: Config = {
  path: '/api/clear-logs'
};
