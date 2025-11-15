import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import { getStore } from '@netlify/blobs';

const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'fetchSharePointData',
      description: 'Fetch a summary of client communication records from SharePoint. Returns multi-line text where each line is one record with fields separated by |.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: "Optional natural-language description or OData-style filter for which records you want. For example: 'conversations awaiting response', 'software installed awaiting hours', or an OData expression like substringof('John', Title). If unsure, use a short natural language phrase."
          }
        },
        required: [],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'performSharePointAction',
      description: 'Perform structured actions for a client conversation, such as sending emails, booking sessions with Teams meetings, or replying to an existing thread. This calls a Power Automate flow which updates Outlook and SharePoint.',
      parameters: {
        type: 'object',
        properties: {
          flow_type: {
            type: 'integer',
            enum: [1, 2, 3, 99],
            description: 'Type of action to perform. Use 1 to send a brand new email, 2 to create a booking (calendar event + Teams meeting) and update SharePoint, 3 to reply to an existing email conversation, 99 for a non-destructive test or no-op if supported.'
          },
          description: {
            type: 'string',
            description: "Internal description of what this action is doing, for logging in SharePoint and Power Automate. Summarise the user's request here."
          },
          client_name: {
            type: 'string',
            description: "Client's full name as stored in SharePoint if known."
          },
          client_email: {
            type: 'string',
            description: "Client's primary email address."
          },
          email_source: {
            type: 'string',
            description: "Which brand/mailbox to use, e.g. 'neurobox' or 'enablingtech'."
          },
          email_subject: {
            type: 'string',
            description: 'Subject line for outgoing emails. For replies, usually reuse the existing subject.'
          },
          email_body: {
            type: 'string',
            description: 'Plain-text body of the email to send to the client. Write friendly, professional text ready to send.'
          },
          body_event: {
            type: 'string',
            description: 'Optional long body/notes for a calendar event or booking. If there is nothing to add, send a single space character.',
            default: ' '
          },
          start_time: {
            type: 'string',
            description: 'Start time for a booking in UK local time, formatted as YYYY-MM-DDTHH:mm:ss with NO timezone suffix (no Z or offset). For actions that do not create a booking, pass an empty string.'
          },
          end_time: {
            type: 'string',
            description: 'End time for a booking in UK local time, formatted as YYYY-MM-DDTHH:mm:ss with NO timezone suffix (no Z or offset). For actions that do not create a booking, pass an empty string.'
          },
          conversation_id: {
            type: 'string',
            description: 'Outlook conversation ID for this thread. Required when replying in an existing thread; can be empty for brand new outbound emails.'
          },
          message_id: {
            type: 'string',
            description: 'Outlook message ID to reply to. Required when replying to a specific message; can be empty for brand new outbound emails.'
          },
          source: {
            type: 'string',
            description: "Free text indicating that this call came from the GPT voice agent, e.g. 'GPT-Automation'.",
            default: 'GPT-Automation'
          },
          sharepoint_id: {
            type: 'integer',
            description: 'The numeric SharePoint list item ID for the conversation to update. If there is no existing list item, use 0.',
            default: 0
          }
        },
        required: [
          'flow_type',
          'description',
          'client_name',
          'client_email',
          'email_source',
          'email_subject',
          'email_body',
          'start_time',
          'end_time',
          'conversation_id',
          'message_id',
          'source',
          'sharepoint_id'
        ],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'manageSharePointItem',
      description: 'Update or delete a SharePoint item via a Power Automate flow. Use this to patch fields on ClientTrainingStatus or to delete a conversation record when instructed.',
      parameters: {
        type: 'object',
        properties: {
          flow_type: {
            type: 'integer',
            enum: [4, 5],
            description: 'Type of operation. Use 4 to PATCH/update fields on a SharePoint item. Use 5 to DELETE a SharePoint item.'
          },
          sharepoint_id: {
            type: 'string',
            description: 'The ID of the SharePoint item to update or delete. Use the exact ID from the SharePoint list.'
          },
          send_http_request_to_sharepoint: {
            type: 'string',
            description: 'When flow_type is 4 (update), this must contain a JSON string representing the body of the HTTP PATCH request that Power Automate will send to SharePoint. For delete (flow_type 5), send an empty string.',
            default: ''
          }
        },
        required: [
          'flow_type',
          'sharepoint_id',
          'send_http_request_to_sharepoint'
        ],
        additionalProperties: false
      }
    }
  }
];

async function getConfig() {
  const configStore = getStore('assistant-config');
  const configJson = await configStore.get('config');
  
  if (!configJson) {
    throw new Error('Configuration not found. Please complete setup first.');
  }
  
  return JSON.parse(configJson);
}

async function callPowerAutomate(url: string, body: any): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Power Automate request failed with status ${response.status}`);
  }

  return await response.json();
}

async function handleToolCall(toolName: string, toolArgs: any, config: any): Promise<any> {
  switch (toolName) {
    case 'fetchSharePointData':
      return await callPowerAutomate(config.fetchUrl, { query: toolArgs.query || '' });
    
    case 'performSharePointAction':
      return await callPowerAutomate(config.actionUrl, toolArgs);
    
    case 'manageSharePointItem':
      return await callPowerAutomate(config.manageUrl, toolArgs);
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { message, conversation_id } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = await getConfig();
    const openai = new OpenAI({ apiKey: config.openaiKey });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant that manages SharePoint client communications. You can fetch conversation records, send emails, book meetings, reply to threads, and manage SharePoint items. Always be professional and clear in your responses.'
      },
      {
        role: 'user',
        content: message
      }
    ];

    let assistantReply = '';
    let iterationCount = 0;
    const maxIterations = 10;

    while (iterationCount < maxIterations) {
      iterationCount++;

      const completion = await openai.chat.completions.create({
        model: config.openaiModel || 'gpt-5.1',
        messages: messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto'
      });

      const responseMessage = completion.choices[0].message;
      messages.push(responseMessage);

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          try {
            const toolResult = await handleToolCall(toolName, toolArgs, config);

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult)
            });
          } catch (error) {
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error'
              })
            });
          }
        }
      } else {
        assistantReply = responseMessage.content || '';
        break;
      }
    }

    if (!assistantReply && iterationCount >= maxIterations) {
      assistantReply = 'I apologize, but I reached the maximum number of iterations while processing your request. Please try again with a simpler request.';
    }

    return new Response(
      JSON.stringify({ assistant_reply: assistantReply }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Assistant error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
