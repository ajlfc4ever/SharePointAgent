import type { APIRoute } from 'astro';
import OpenAI from 'openai';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          message: `Expected JSON request but got ${contentType}`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { openaiKey, openaiModel, fetchUrl, actionUrl, manageUrl } = body;

    const results = {
      openai: { success: false, message: '' },
      fetchFlow: { success: false, message: '' },
      actionFlow: { success: false, message: '' },
      manageFlow: { success: false, message: '' },
      allSuccess: false
    };

    try {
      const openai = new OpenAI({ apiKey: openaiKey, timeout: 8000 });
      
      if (openaiModel.includes('realtime')) {
        const modelsResponse = await openai.models.list();
        const hasAccess = modelsResponse.data.some(m => m.id === openaiModel || m.id.includes('gpt-4'));
        
        if (hasAccess) {
          results.openai = { success: true, message: 'OpenAI API key validated successfully (Note: Realtime API requires live connection from GPT client, not this test endpoint)' };
        } else {
          results.openai = { success: false, message: 'API key valid but no access to GPT-4 models' };
        }
      } else {
        const completion = await openai.chat.completions.create({
          model: openaiModel,
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        });
        
        if (completion.choices && completion.choices.length > 0) {
          results.openai = { success: true, message: 'OpenAI connection successful' };
        } else {
          results.openai = { success: false, message: 'Unexpected OpenAI response' };
        }
      }
    } catch (error) {
      results.openai = {
        success: false,
        message: `OpenAI error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const fetchResponse = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (fetchResponse.ok) {
        const contentType = fetchResponse.headers.get('content-type');
        const responseText = await fetchResponse.text();
        
        console.log(`Fetch Flow (${fetchUrl}) - Status: ${fetchResponse.status}, Content-Type: ${contentType}`);
        console.log(`Fetch Flow response (first 200 chars): ${responseText.substring(0, 200)}`);
        
        if (!responseText || responseText.trim() === '') {
          results.fetchFlow = {
            success: false,
            message: `Fetch Flow (${fetchUrl}): Returned empty response`
          };
        } else if (contentType && contentType.includes('application/json')) {
          try {
            const data = JSON.parse(responseText);
            results.fetchFlow = {
              success: true,
              message: `Fetch Flow responded with status ${fetchResponse.status}`
            };
          } catch (jsonError) {
            results.fetchFlow = {
              success: false,
              message: `Fetch Flow (${fetchUrl}): Invalid JSON - ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}. Response: ${responseText.substring(0, 200)}`
            };
          }
        } else {
          results.fetchFlow = {
            success: false,
            message: `Fetch Flow (${fetchUrl}): Expected JSON but got ${contentType || 'unknown content type'}. Response: ${responseText.substring(0, 200)}`
          };
        }
      } else {
        results.fetchFlow = {
          success: false,
          message: `Fetch Flow (${fetchUrl}) returned status ${fetchResponse.status}`
        };
      }
    } catch (error) {
      results.fetchFlow = {
        success: false,
        message: `Fetch Flow (${fetchUrl}) error: ${error instanceof Error ? (error.name === 'AbortError' ? 'Request timed out after 8 seconds' : error.message) : 'Unknown error'}`
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const actionResponse = await fetch(actionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_type: 99,
          description: 'Test connection',
          client_name: 'Test',
          client_email: 'test@example.com',
          email_source: 'test',
          email_subject: 'Test',
          email_body: 'Test',
          body_event: ' ',
          start_time: '',
          end_time: '',
          conversation_id: '',
          message_id: '',
          source: 'Setup-Test',
          sharepoint_id: 0
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (actionResponse.ok) {
        const contentType = actionResponse.headers.get('content-type');
        const responseText = await actionResponse.text();
        
        console.log(`Action Flow (${actionUrl}) - Status: ${actionResponse.status}, Content-Type: ${contentType}`);
        console.log(`Action Flow response (first 200 chars): ${responseText.substring(0, 200)}`);
        
        if (!responseText || responseText.trim() === '') {
          results.actionFlow = {
            success: false,
            message: `Action Flow (${actionUrl}): Returned empty response`
          };
        } else if (contentType && contentType.includes('application/json')) {
          try {
            const data = JSON.parse(responseText);
            results.actionFlow = {
              success: true,
              message: `Action Flow responded with status ${actionResponse.status}`
            };
          } catch (jsonError) {
            results.actionFlow = {
              success: false,
              message: `Action Flow (${actionUrl}): Invalid JSON - ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}. Response: ${responseText.substring(0, 200)}`
            };
          }
        } else {
          results.actionFlow = {
            success: false,
            message: `Action Flow (${actionUrl}): Expected JSON but got ${contentType || 'unknown content type'}. Response: ${responseText.substring(0, 200)}`
          };
        }
      } else {
        results.actionFlow = {
          success: false,
          message: `Action Flow (${actionUrl}) returned status ${actionResponse.status}`
        };
      }
    } catch (error) {
      results.actionFlow = {
        success: false,
        message: `Action Flow (${actionUrl}) error: ${error instanceof Error ? (error.name === 'AbortError' ? 'Request timed out after 8 seconds' : error.message) : 'Unknown error'}`
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const manageResponse = await fetch(manageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_type: 4,
          sharepoint_id: '0',
          send_http_request_to_sharepoint: ''
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (manageResponse.ok) {
        const contentType = manageResponse.headers.get('content-type');
        const responseText = await manageResponse.text();
        
        console.log(`Manage Flow (${manageUrl}) - Status: ${manageResponse.status}, Content-Type: ${contentType}`);
        console.log(`Manage Flow response (first 200 chars): ${responseText.substring(0, 200)}`);
        
        if (!responseText || responseText.trim() === '') {
          results.manageFlow = {
            success: false,
            message: `Manage Flow (${manageUrl}): Returned empty response`
          };
        } else if (contentType && contentType.includes('application/json')) {
          try {
            const data = JSON.parse(responseText);
            results.manageFlow = {
              success: true,
              message: `Manage Flow responded with status ${manageResponse.status}`
            };
          } catch (jsonError) {
            results.manageFlow = {
              success: false,
              message: `Manage Flow (${manageUrl}): Invalid JSON - ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}. Response: ${responseText.substring(0, 200)}`
            };
          }
        } else {
          results.manageFlow = {
            success: false,
            message: `Manage Flow (${manageUrl}): Expected JSON but got ${contentType || 'unknown content type'}. Response: ${responseText.substring(0, 200)}`
          };
        }
      } else {
        results.manageFlow = {
          success: false,
          message: `Manage Flow (${manageUrl}) returned status ${manageResponse.status}`
        };
      }
    } catch (error) {
      results.manageFlow = {
        success: false,
        message: `Manage Flow (${manageUrl}) error: ${error instanceof Error ? (error.name === 'AbortError' ? 'Request timed out after 8 seconds' : error.message) : 'Unknown error'}`
      };
    }

    results.allSuccess = results.openai.success && results.fetchFlow.success && 
                         results.actionFlow.success && results.manageFlow.success;

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Test configuration error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to test configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
