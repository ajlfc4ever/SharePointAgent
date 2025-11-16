import { getStore } from '@netlify/blobs';

const logStore = getStore('voice-chat-logs');
const { blobs } = await logStore.list();
console.log('Total blobs:', blobs.length);

const logs = await Promise.all(
  blobs.map(async (blob) => {
    const data = await logStore.get(blob.key, { type: 'json' });
    return data;
  })
);

logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

const sessionUpdated = logs.find(l => l.message && l.message.includes('Session updated confirmed'));
const functionCalls = logs.filter(l => l.message && (l.message.includes('Processing function call') || l.message.includes('function_call_arguments')));
const warnings = logs.filter(l => l.message && l.message.includes('NO function call'));
const userTranscripts = logs.filter(l => l.message && l.message.includes('User transcript complete'));
const responseCycles = logs.filter(l => l.message && l.message.includes('Response cycle complete'));

console.log('\n=== SUMMARY ===');
console.log('Session tools configured:', !!sessionUpdated);
if (sessionUpdated) {
  console.log('  Tool count:', sessionUpdated.data?.toolCount);
  console.log('  Tool names:', sessionUpdated.data?.toolNames?.join(', '));
}
console.log('Function calls detected:', functionCalls.length);
console.log('User transcripts:', userTranscripts.length);
console.log('Response cycles:', responseCycles.length);
console.log('Hallucination warnings:', warnings.length);

if (userTranscripts.length > 0) {
  console.log('\n=== USER SAID ===');
  userTranscripts.forEach(t => {
    console.log('  "' + t.data?.transcript + '"');
    console.log('    Looks like data query:', t.data?.looksLikeDataQuery);
  });
}

if (responseCycles.length > 0) {
  console.log('\n=== RESPONSE CYCLES ===');
  responseCycles.forEach(r => {
    console.log('  Response ID:', r.data?.responseId);
    console.log('    Has text:', r.data?.hasTextResponse);
    console.log('    Has function call:', r.data?.hasFunctionCall);
    console.log('    Output types:', r.data?.outputTypes?.join(', '));
  });
}

if (warnings.length > 0) {
  console.log('\n=== HALLUCINATION WARNINGS (Assistant answered without calling function) ===');
  warnings.forEach(w => {
    console.log(JSON.stringify(w, null, 2));
  });
}

if (functionCalls.length > 0) {
  console.log('\n=== FUNCTION CALLS ===');
  functionCalls.forEach(f => {
    console.log(JSON.stringify(f, null, 2));
  });
} else {
  console.log('\n=== NO FUNCTION CALLS FOUND ===');
  console.log('This is the problem! The assistant is NOT calling fetchSharePointData.');
}

console.log('\n=== FULL LOG TIMELINE ===');
logs.forEach(l => {
  console.log('[' + l.timestamp + '] [' + l.level + '] ' + l.message);
  if (l.data && Object.keys(l.data).length > 0) {
    const dataStr = JSON.stringify(l.data);
    console.log('  ' + (dataStr.length > 200 ? dataStr.substring(0, 200) + '...' : dataStr));
  }
});
