import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const logStore = getStore('voice-chat-logs');
    
    const { blobs } = await logStore.list();
    
    const logs = await Promise.all(
      blobs.map(async (blob) => {
        const data = await logStore.get(blob.key, { type: 'json' });
        return data;
      })
    );
    
    logs.sort((a: any, b: any) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    // Analyze logs
    const sessionUpdated = logs.find((l: any) => l.message?.includes('Session updated confirmed'));
    const functionCalls = logs.filter((l: any) => 
      l.message?.includes('Processing function call') || 
      l.message?.includes('Function call') ||
      l.message?.includes('function_call')
    );
    const userTranscripts = logs.filter((l: any) => l.message?.includes('User transcript complete'));
    const warnings = logs.filter((l: any) => l.level === 'warn' || l.message?.includes('NO function call'));
    const responseCycles = logs.filter((l: any) => l.message?.includes('Response cycle complete'));
    
    return new Response(
      JSON.stringify({ 
        summary: {
          totalLogs: logs.length,
          hasSessionUpdated: !!sessionUpdated,
          toolCount: sessionUpdated?.data?.toolCount || 0,
          toolNames: sessionUpdated?.data?.toolNames || [],
          functionCallCount: functionCalls.length,
          userTranscriptCount: userTranscripts.length,
          warningCount: warnings.length,
          responseCycleCount: responseCycles.length
        },
        sessionUpdated,
        functionCalls,
        userTranscripts,
        warnings,
        responseCycles,
        allLogs: logs
      }, null, 2),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        } 
      }
    );
  } catch (error) {
    console.error('Export logs error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to export logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
