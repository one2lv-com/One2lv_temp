import WebSocket from 'ws';
const ws = new WebSocket('ws://localhost:8787/ws');
ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'chat',
    modelId: 'kimi-k2',
    messages: [{ role: 'user', content: 'Please scrape https://example.com and tell me the page title and one sentence summary. Use the web_scrape tool.' }],
    voice: false
  }));
});
let text = '';
ws.on('message', (raw) => {
  const m = JSON.parse(raw.toString());
  if (m.type === 'delta') {
    if (m.meta?.tool) console.log('\n[tool trace]', m.delta.trim());
    else { process.stdout.write(m.delta); text += m.delta; }
  } else if (m.type === 'done') {
    console.log('\n\nDONE. transcript:', JSON.stringify(m.transcript, null, 2).slice(0, 800));
    ws.close(); process.exit(0);
  } else if (m.type === 'error') {
    console.log('ERROR:', m.error); process.exit(1);
  }
});
ws.on('error', (e) => { console.log('ws err', e.message); process.exit(1); });
setTimeout(() => { console.log('timeout'); process.exit(2); }, 60000);
