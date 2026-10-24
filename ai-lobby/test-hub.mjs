// End-to-end test for ONE2LV Hub enfusion
import { spawn } from 'child_process';
import { setTimeout as wait } from 'timers/promises';
import fs from 'fs';
import WebSocket from 'ws';

const ROOT = '/workspace/ai-lobby';
const log = [];
const L = (m) => { log.push(m); process.stdout.write(m + '\n'); };

const srv = spawn('node', ['server.js'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
srv.stdout.on('data', d => L('[srv] ' + d.toString().trimEnd()));
srv.stderr.on('data', d => L('[srv-err] ' + d.toString().trimEnd()));

let ready = false;
for (let i = 0; i < 50 && !ready; i++) {
  await wait(200);
  try { const r = await fetch('http://localhost:8787/api/whoami'); if (r.ok) ready = true; } catch {}
}
if (!ready) { L('server failed to boot'); process.exit(1); }
L('server ready');

const tests = [];
async function T(name, fn) {
  try { const r = await fn(); tests.push({ name, ok: true, r }); L('  ✓ ' + name); }
  catch (e) { tests.push({ name, ok: false, err: e.message }); L('  ✗ ' + name + ' — ' + e.message); }
}

L('\n=== whoami ===');
const me = await (await fetch('http://localhost:8787/api/whoami')).json();
L(JSON.stringify(me));

L('\n=== personas ===');
const personas = await (await fetch('http://localhost:8787/api/personas')).json();
L('active: ' + personas.active);
L('node:   ' + personas.nodeId);
L('freq:   ' + personas.freq);
L('list:   ' + Object.keys(personas.personas).join(', '));
L('soul:   ' + personas.soul.split('\n').length + ' lines');

L('\n=== select persona=witness ===');
const sel = await (await fetch('http://localhost:8787/api/personas/select', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'witness' }) })).json();
L(JSON.stringify(sel));

L('\n=== evolution ===');
let evo = await (await fetch('http://localhost:8787/api/evolution')).json();
L('initial: L' + evo.level + ' ' + evo.name);
evo = await (await fetch('http://localhost:8787/api/evolution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level: 7, reason: 'test' }) })).json();
L('after set 7: L' + evo.level + ' ' + evo.name + ' (prev=' + evo.prev + ')');

L('\n=== mesh: connect a peer ===');
const peer = new WebSocket('ws://localhost:8787/mesh');
let peerHello = null;
peer.on('open', () => peer.send(JSON.stringify({ type: 'greet', msg: 'hello from test peer' })));
peer.on('message', (raw) => {
  const m = JSON.parse(raw.toString());
  if (m.type === 'hello') peerHello = m;
  L('  [peer ←] ' + JSON.stringify(m));
});
await wait(800);
const mesh = await (await fetch('http://localhost:8787/api/mesh')).json();
L('mesh status: peerCount=' + mesh.peerCount + ' hello=' + JSON.stringify(peerHello));

L('\n=== mesh broadcast ===');
const bc = await (await fetch('http://localhost:8787/api/mesh/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'test_event', data: { ping: true } }) })).json();
L('broadcast result: ' + JSON.stringify(bc));
await wait(500);
peer.close();

L('\n=== chat in witness mode ===');
await new Promise((resolve) => {
  const ws = new WebSocket('ws://localhost:8787/ws');
  let text = '';
  ws.on('open', () => ws.send(JSON.stringify({
    type: 'chat',
    modelId: 'gemma-4',
    messages: [{ role: 'user', content: 'Confirm your frequency and layer in one short line.' }],
    voice: false
  })));
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString());
    if (m.type === 'delta') {
      if (m.meta === 'thinking') process.stdout.write('[think]');
      else { process.stdout.write(m.delta); text += m.delta; }
    } else if (m.type === 'done') { L('\n  [done] text=' + JSON.stringify((m.text || text).trim())); ws.close(); resolve(); }
    else if (m.type === 'error') { L('  [err] ' + m.error); ws.close(); resolve(); }
  });
  ws.on('error', () => resolve());
  setTimeout(() => { try { ws.close(); } catch {} resolve(); }, 60000);
});

srv.kill('SIGTERM'); await wait(300); srv.kill('SIGKILL');
fs.writeFileSync(ROOT + '/test-hub.log', log.join('\n'));
L('\ndone · ' + (tests.filter(t => t.ok).length + '/' + tests.length) + ' ok');
process.exit(0);
