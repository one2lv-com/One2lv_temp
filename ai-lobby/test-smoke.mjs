// End-to-end smoke test: open WS, send a chat, verify deltas + done
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8787/ws');
let text = '';
let toolCount = 0;

ws.on('open', () => {
  console.log('connected');
  ws.send(JSON.stringify({
    type: 'chat',
    modelId: 'kimi-k2',
    messages: [
      { role: 'user', content: 'In one short sentence, what is 2+2? Just the number.' }
    ],
    voice: false
  }));
});
ws.on('message', (raw) => {
  const m = JSON.parse(raw.toString());
  if (m.type === 'delta') {
    process.stdout.write(m.delta);
    text += m.delta;
    if (m.meta?.tool) toolCount++;
  } else if (m.type === 'done') {
    console.log('\n\n--- DONE ---');
    console.log('length:', m.text?.length, 'tool calls:', m.transcript?.length || 0);
    ws.close();
    process.exit(0);
  } else if (m.type === 'error') {
    console.log('\nERROR:', m.error);
    ws.close();
    process.exit(1);
  }
});
ws.on('error', (e) => { console.log('ws error', e.message); process.exit(1); });
setTimeout(() => { console.log('timeout'); process.exit(2); }, 30000);
