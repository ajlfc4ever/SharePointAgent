import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { level, message, data } = body;
    
    // Get log store
    const logStore = getStore('voice-chat-logs');
    
    // Create log entry with timestamp
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level || 'info',
      message: message || '',
      data: data || {}
    };
    
    // Append to log file with timestamp as key
    const logKey = `${timestamp.replace(/[:.]/g, '-')}-${Date.now()}`;
    await logStore.setJSON(logKey, logEntry);
    
    // Also log to console for immediate visibility
    console.log(`[${level}] ${message}`, data || '');
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Logging error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to log message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
