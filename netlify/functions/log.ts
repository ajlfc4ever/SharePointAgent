import { Config } from '@netlify/functions';

const logs: Array<{timestamp: string, level: string, message: string, data?: any}> = [];
const MAX_LOGS = 1000;

export default async (req: Request) => {
  const url = new URL(req.url);
  
  if (req.method === 'POST') {
    try {
      const logEntry = await req.json();
      const entry = {
        timestamp: new Date().toISOString(),
        level: logEntry.level || 'info',
        message: logEntry.message || '',
        data: logEntry.data
      };
      
      logs.unshift(entry);
      if (logs.length > MAX_LOGS) {
        logs.pop();
      }
      
      console.log(`[CLIENT LOG] [${entry.level.toUpperCase()}]`, entry.message, entry.data || '');
      
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Failed to process log:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to process log' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else if (req.method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const level = url.searchParams.get('level');
    
    let filteredLogs = logs;
    if (level) {
      filteredLogs = logs.filter(log => log.level === level);
    }
    
    return new Response(
      JSON.stringify(filteredLogs.slice(0, limit)),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        } 
      }
    );
  } else {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config: Config = {
  path: '/api/log'
};
