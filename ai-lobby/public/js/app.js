// AI Lobby — main client app
// Handles: views, chat streaming, voice overlay, file manager, terminal, skills, memory, settings.

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const state = {
  models: [],
  activeModel: null,
  threads: [],
  activeThread: null,
  user: null,
  isAdmin: false,
  showKeys: false,
  voiceOverlay: false,
  ws: null,
  currentRun: null,
  filePath: '/',
  settings: {},
  config: null,
  persona: 'default',
  nodeId: '',
  freq: '73.0 Hz',
  personas: {},
  evo: { level: 1, name: 'Initiate', aggression: 30, reactionMs: 800 },
  mesh: { nodeId: '', peerCount: 0, peers: [] }
};

// ----- Toasts -----
function toast(msg, kind='') {
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; }, 2400);
  setTimeout(() => el.remove(), 2800);
}

// ----- Starfield -----
function initStarfield() {
  const c = $('#starfield');
  const ctx = c.getContext('2d');
  let stars = [];
  function resize() {
    c.width = window.innerWidth * devicePixelRatio;
    c.height = window.innerHeight * devicePixelRatio;
    c.style.width = window.innerWidth + 'px';
    c.style.height = window.innerHeight + 'px';
    const count = Math.min(220, Math.floor((window.innerWidth * window.innerHeight) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      z: Math.random() * 0.8 + 0.2,
      r: Math.random() * 1.2 + 0.2
    }));
  }
  resize();
  window.addEventListener('resize', resize);
  function frame() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const s of stars) {
      s.x -= 0.04 * s.z * devicePixelRatio;
      if (s.x < 0) s.x = c.width;
      ctx.globalAlpha = s.z;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  frame();
}

// ----- API helpers -----
async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || 'GET',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) {
    let err; try { err = await res.json(); } catch { err = await res.text(); }
    throw new Error(err?.error || res.statusText);
  }
  return res.json();
}

// ----- Boot -----
async function boot() {
  initStarfield();
  bindGlobalUI();
  await loadWhoAmI();
  await loadModels();
  await loadSkills();
  await loadMemory();
  await loadSettings();
  loadThreads();
  connectWS();
  focusInput();
}

function bindGlobalUI() {
  $$('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  $('#loginBtn').addEventListener('click', () => $('#loginModal').hidden = false);
  $('#loginCancel').addEventListener('click', () => $('#loginModal').hidden = true);
  $('#loginFormModal').addEventListener('submit', onLogin);
  $('#loginForm').addEventListener('submit', onLogin);
  $('#newChatBtn').addEventListener('click', () => newThread());
  $('#sendBtn').addEventListener('click', () => sendMessage());
  $('#input').addEventListener('keydown', onInputKey);
  $('#input').addEventListener('input', autoSize);
  $('#micBtn').addEventListener('mousedown', startVoiceHold);
  $('#micBtn').addEventListener('mouseup', stopVoiceHold);
  $('#micBtn').addEventListener('mouseleave', stopVoiceHold);
  $('#voiceOverlayBtn').addEventListener('click', () => openVoiceOverlay());
  $('#voiceClose').addEventListener('click', () => closeVoiceOverlay());
  $('#voiceCore').addEventListener('click', () => toggleVoiceSession());
  $('#exportBtn').addEventListener('click', exportThread);
  $('#clearBtn').addEventListener('click', clearCurrentThread);
  $('#memSearch').addEventListener('click', searchMemory);
  $('#memQuery').addEventListener('keydown', (e) => { if (e.key === 'Enter') searchMemory(); });
  $('#memClear').addEventListener('click', async () => {
    if (!state.isAdmin) { toast('Admin only', 'error'); return; }
    if (!confirm('Wipe all memory?')) return;
    await api('/api/clear-history', { method: 'POST' });
    state.threads = []; state.activeThread = null;
    saveThreads();
    await loadMemory();
    renderThreads();
    $('#messages').innerHTML = '<div class="empty-state"><div class="empty-glyph">∅</div><h1>Memory wiped</h1></div>';
    toast('Memory cleared', 'ok');
  });
  $('#saveSettings').addEventListener('click', saveSettings);
  $('#saveConfig').addEventListener('click', saveConfig);
  $('#savePrompt').addEventListener('click', savePrompt);
  $('#saveAdmin').addEventListener('click', saveAdmin);
  $('#showKeys').addEventListener('change', (e) => { state.showKeys = e.target.checked; renderModelsConfig(); });
  $('#voiceToggle').addEventListener('change', (e) => { state.voiceOverlay = e.target.checked; });
  $('#themeSel').addEventListener('change', (e) => document.documentElement.dataset.theme = e.target.value);
  $$('.empty-chips .chip, .ghost-btn[data-insert]').forEach(b => b.addEventListener('click', () => {
    const t = b.dataset.insert;
    if (t && t.includes('Run `') && !state.isAdmin) { toast('Admin only', 'error'); return; }
    $('#input').value = t || '';
    autoSize();
    sendMessage();
  }));

  // Files
  $('#filesUp').addEventListener('click', () => goFileUp());
  $('#filesNew').addEventListener('click', () => createFile());
  $('#filesMkdir').addEventListener('click', () => createFolder());
  $('#filesUpload').addEventListener('change', (e) => uploadFile(e.target.files[0]));

  // Terminal
  $('#termForm').addEventListener('submit', runTerm);
}

// ----- View switching -----
function switchView(name) {
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  $$('.view').forEach(v => v.hidden = v.dataset.view !== name);
  if (name === 'skills') renderSkills();
  if (name === 'memory') renderMemory();
  if (name === 'files') loadFiles();
  if (name === 'settings') loadSettingsView();
  if (name === 'hub') loadHub();
}

// ----- Whoami / login -----
async function loadWhoAmI() {
  const me = await api('/api/whoami');
  state.user = me.user;
  state.isAdmin = !!me.isAdmin;
  state.persona = me.persona || 'default';
  state.nodeId = me.nodeId || '';
  state.freq = me.freq || '73.0 Hz';
  $('#userLabel').textContent = me.user || 'guest';
  if (me.isAdmin) $('#userPill').classList.add('admin');
  $$('.admin-only').forEach(el => el.hidden = !me.isAdmin);
  applyPersona(state.persona);
  updateWitnessFooter();
  renderPersonaChips();
}
async function onLogin(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = { username: fd.get('username'), password: fd.get('password') };
  try {
    const res = await api('/api/login', { method: 'POST', body });
    state.user = res.user; state.isAdmin = res.isAdmin;
    $('#userLabel').textContent = res.user;
    $('#userPill').classList.add('admin');
    $$('.admin-only').forEach(el => el.hidden = false);
    $('#loginModal').hidden = true;
    $('#loginError').hidden = true; $('#loginErrorModal').hidden = true;
    e.target.reset();
    toast('Signed in as ' + res.user, 'ok');
    await loadSettingsView();
    await loadSkills();
  } catch (err) {
    const which = e.target.id === 'loginForm' ? '#loginError' : '#loginErrorModal';
    $(which).textContent = err.message;
    $(which).hidden = false;
  }
}

// ----- Models -----
async function loadModels() {
  state.models = await api('/api/models');
  if (!state.activeModel && state.models[0]) state.activeModel = state.models[0].id;
  renderModelTabs();
  renderActiveModelPill();
}
function renderModelTabs() {
  const wrap = $('#modelTabs');
  wrap.innerHTML = '';
  for (const m of state.models) {
    const el = document.createElement('div');
    el.className = 'model-tab' + (m.id === state.activeModel ? ' active' : '');
    el.innerHTML = `
      <span class="swatch" style="background:${m.color};color:${m.color}"></span>
      <div>
        <div class="name">${escapeHtml(m.label)}</div>
        <div class="meta">${escapeHtml(m.model.split('/').pop())}</div>
      </div>`;
    el.addEventListener('click', () => {
      state.activeModel = m.id;
      renderModelTabs(); renderActiveModelPill();
    });
    wrap.appendChild(el);
  }
}
function renderActiveModelPill() {
  const m = state.models.find(x => x.id === state.activeModel);
  if (!m) return;
  $('#activeModelPill').innerHTML = `<span class="dot" style="background:${m.color};color:${m.color}"></span><span>${escapeHtml(m.label)}</span>`;
}

// ----- ONE2LV Hub -----
async function loadHub() {
  const data = await api('/api/personas');
  state.personas = data.personas;
  state.persona = data.active;
  state.nodeId = data.nodeId;
  state.freq = data.freq;
  applyPersona(state.persona);
  updateWitnessFooter();
  renderPersonaChips();
  renderPersonaGrid();
  $('#hubNodeId').textContent = data.nodeId || '—';
  $('#soulPre').textContent = data.soul || '(no soul layer)';
  await loadEvolution();
  await loadMesh();
  bindHubControls();
}

function renderPersonaGrid() {
  const g = $('#personaGrid');
  if (!g) return;
  g.innerHTML = '';
  for (const id of Object.keys(state.personas)) {
    const p = state.personas[id];
    const el = document.createElement('button');
    el.className = 'persona-card' + (id === state.persona ? ' active' : '');
    el.innerHTML = `<span class="ico" style="color:${p.color}">${p.icon}</span><span class="lbl">${escapeHtml(p.label)}</span>`;
    el.addEventListener('click', () => selectPersona(id));
    g.appendChild(el);
  }
  const cur = state.personas[state.persona];
  $('#personaBlurb').textContent = cur?.blurb || '';
}

function renderPersonaChips() {
  $$('.persona-chip').forEach(b => b.classList.toggle('active', b.dataset.persona === state.persona));
}

async function selectPersona(id) {
  const res = await api('/api/personas/select', { method: 'POST', body: { name: id } });
  state.persona = res.active;
  applyPersona(state.persona);
  updateWitnessFooter();
  renderPersonaChips();
  renderPersonaGrid();
  toast('Persona: ' + (state.personas[res.active]?.label || res.active), 'ok');
  // also tell the WS so a running chat can switch
  state.ws?.readyState === 1 && state.ws.send(JSON.stringify({ type: 'persona', name: id }));
}

function applyPersona(id) {
  document.documentElement.dataset.persona = id;
}

function updateWitnessFooter() {
  const f = $('#witnessFooter');
  if (!f) return;
  const isWitness = state.persona === 'witness';
  f.hidden = !isWitness;
  if (isWitness) {
    $('#wfFreq').textContent = state.freq;
    $('#wfNode').textContent = state.nodeId || '—';
  }
}

async function loadEvolution() {
  const evo = await api('/api/evolution');
  state.evo = evo;
  const pct = Math.max(8, (evo.level / 10) * 100);
  $('#evoFill').style.width = pct + '%';
  $('#evoName').textContent = evo.name;
  $('#evoLevel').textContent = evo.level;
  $('#evoStats').textContent = `aggression ${evo.aggression}% · reaction ${evo.reactionMs}ms`;
}

async function loadMesh() {
  const m = await api('/api/mesh');
  state.mesh = m;
  $('#meshBadge').textContent = m.peerCount + ' peer' + (m.peerCount === 1 ? '' : 's');
  $('#meshStatus').textContent = m.peerCount
    ? `connected — node ${m.nodeId}`
    : `standalone — node ${m.nodeId} (peers connect to ws://host:port/mesh)`;
  const list = $('#meshPeers');
  list.innerHTML = '';
  if (!m.peers?.length) { list.innerHTML = '<div class="file-empty">No peers connected.</div>'; return; }
  for (const p of m.peers) {
    const el = document.createElement('div');
    el.className = 'mesh-peer';
    el.innerHTML = `<span class="pid">${escapeHtml(p.id)}</span><span>${escapeHtml(p.meta?.ip || '')}</span><span class="ts">last seen ${new Date(p.lastSeen).toLocaleTimeString()}</span>`;
    list.appendChild(el);
  }
}

let _hubBound = false;
function bindHubControls() {
  if (_hubBound) return; _hubBound = true;
  $('#evoUp')?.addEventListener('click', async () => { await api('/api/evolution', { method: 'POST', body: { level: state.evo.level + 1, reason: 'manual+' } }); loadEvolution(); });
  $('#evoDown')?.addEventListener('click', async () => { await api('/api/evolution', { method: 'POST', body: { level: state.evo.level - 1, reason: 'manual-' } }); loadEvolution(); });
  $('#evoMatch')?.addEventListener('click', async () => {
    // Simulate a match outcome
    const won = Math.random() < 0.6;
    const delta = won ? 1 : -1;
    await api('/api/evolution/bump', { method: 'POST', body: { delta, reason: won ? 'match-win' : 'match-loss' } });
    loadEvolution();
    toast(won ? 'Match won — evolved' : 'Match lost — regressed', won ? 'ok' : 'error');
  });
  $('#meshRefresh')?.addEventListener('click', loadMesh);
  $('#meshBroadcast')?.addEventListener('click', async () => {
    const type = $('#meshEventType').value || 'lobby_event';
    let data = {}; try { data = JSON.parse($('#meshEventData').value || '{}'); } catch { data = { raw: $('#meshEventData').value }; }
    const res = await api('/api/mesh/broadcast', { method: 'POST', body: { type, data } });
    toast(`Broadcast sent · ${res.delivered} peer${res.delivered === 1 ? '' : 's'} reached`, 'ok');
  });
  $$('.persona-chip').forEach(b => b.addEventListener('click', () => selectPersona(b.dataset.persona)));
}

// Refresh mesh on the hub every 3s while open
setInterval(() => { if (!$('.view-hub')?.hidden) loadMesh(); }, 3000);

// ----- Skills -----
async function loadSkills() {
  const list = await api('/api/skills');
  state.skills = list;
  renderSkills();
}
function renderSkills() {
  const grid = $('#skillGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const s of state.skills) {
    const el = document.createElement('div');
    el.className = 'skill-card' + (s.available ? '' : ' locked');
    el.innerHTML = `
      <div class="ic">${iconFor(s.icon)}</div>
      <div class="lb">${escapeHtml(s.label)} ${s.admin ? '<span class="badge danger">admin</span>' : ''}</div>
      <div class="ds">${escapeHtml(s.desc)}</div>
      <div class="tg">${s.available ? 'available' : 'admin required'}</div>`;
    el.addEventListener('click', () => {
      if (!s.available) { toast('Admin only', 'error'); return; }
      const t = suggestForSkill(s);
      if (t) {
        switchView('chat');
        $('#input').value = t;
        autoSize();
        sendMessage();
      }
    });
    grid.appendChild(el);
  }
}
function iconFor(name) {
  return {
    globe: '🌐', search: '🔎', brain: '🧠', sparkles: '✨', mic: '🎙️', list: '📋',
    grid: '🧰', file: '📄', pencil: '✏️', folder: '📁', terminal: '⌨️'
  }[name] || '⚡';
}
function suggestForSkill(s) {
  switch (s.id) {
    case 'web_scrape': return 'Scrape https://example.com and summarize the page in 3 bullets.';
    case 'web_search': return 'Search the web for "latest AI breakthroughs" and summarize top 3 results.';
    case 'memory_store': return 'Remember: my favorite framework is Svelte and I prefer dark mode. Tag: pref.';
    case 'memory_recall': return 'What do you remember about me?';
    case 'voice_speak': return 'Say a friendly hello and tell me a fun fact.';
    case 'plan_task': return 'Plan a 5-step launch checklist for a new website and store the plan.';
    case 'skill_list': return 'List all of your available skills.';
    case 'file_read': return 'List the files in the workspace, then read README.md if it exists.';
    case 'file_write': return 'Create a file called hello.md with "# Hello from the AI" content.';
    case 'file_list': return 'List the workspace root directory.';
    case 'terminal_run': return 'Run `uname -a` and `ls -la` and tell me what you see.';
  }
  return null;
}

// ----- Memory -----
async function loadMemory() {
  const res = await api('/api/memory');
  state.memory = res;
  renderMemory();
}
function renderMemory() {
  const list = $('#memoryList');
  if (!list) return;
  list.innerHTML = '';
  if (!state.memory?.items?.length) {
    list.innerHTML = '<div class="file-empty">No memories yet. Try: <em>"Remember: I prefer dark mode."</em></div>';
    return;
  }
  for (const m of state.memory.items) {
    const el = document.createElement('div');
    el.className = 'memory-item';
    el.innerHTML = `
      <div class="txt">${escapeHtml(m.text)}</div>
      <div class="tg">${escapeHtml(m.tag || '')}</div>
      <div class="ts">${new Date(m.ts).toLocaleString()}</div>`;
    list.appendChild(el);
  }
}
async function searchMemory() {
  const q = $('#memQuery').value.trim();
  if (!q) { renderMemory(); return; }
  const list = $('#memoryList');
  list.innerHTML = '<div class="file-empty">Searching…</div>';
  // simple client-side: re-rank memory by token overlap
  const tokens = new Set(q.toLowerCase().match(/[a-z0-9]{3,}/g) || []);
  const scored = (state.memory?.items || []).map(m => {
    const text = (m.text || '').toLowerCase();
    let s = 0;
    for (const t of tokens) if (text.includes(t)) s++;
    return { m, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
  list.innerHTML = '';
  if (!scored.length) { list.innerHTML = '<div class="file-empty">No matches.</div>'; return; }
  for (const x of scored) {
    const m = x.m;
    const el = document.createElement('div');
    el.className = 'memory-item';
    el.innerHTML = `
      <div class="txt">${escapeHtml(m.text)}</div>
      <div class="tg">${escapeHtml(m.tag || '')}</div>
      <div class="ts">${new Date(m.ts).toLocaleString()}</div>`;
    list.appendChild(el);
  }
}

// ----- Settings -----
async function loadSettings() {
  const s = await api('/api/settings');
  state.settings = s;
  state.showKeys = !!s.showApiKeys;
  state.voiceOverlay = !!s.voiceOverlay;
  if (s.theme) document.documentElement.dataset.theme = s.theme;
}
async function loadSettingsView() {
  if (!state.isAdmin) {
    $('#settingsGate').hidden = false;
    $('#settingsPanel').hidden = true;
    return;
  }
  $('#settingsGate').hidden = true;
  $('#settingsPanel').hidden = false;
  $('#showKeys').checked = state.showKeys;
  $('#voiceToggle').checked = state.voiceOverlay;
  $('#themeSel').value = state.settings.theme || 'aurora';
  const cfg = await api('/api/admin/config');
  state.config = cfg;
  $('#systemPrompt').value = cfg.systemPrompt || '';
  $('#adminUser').value = cfg.admin.username;
  $('#adminPass').value = cfg.admin.password;
  renderModelsConfig();
}
function renderModelsConfig() {
  const wrap = $('#modelsConfig');
  if (!wrap || !state.config) return;
  wrap.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'models-config-grid';
  for (const m of state.config.models) {
    const card = document.createElement('div');
    card.className = 'model-config-card';
    const keyShown = state.showKeys ? m.apiKey : '•'.repeat(Math.min(28, (m.apiKey || '').length || 16));
    card.innerHTML = `
      <div class="hdr">
        <span class="swatch" style="background:${m.color}"></span>
        <input data-k="label" value="${escapeAttr(m.label)}" placeholder="Label" />
        <input data-k="id" value="${escapeAttr(m.id)}" placeholder="id" />
      </div>
      <div class="grid2">
        <input data-k="model" value="${escapeAttr(m.model)}" placeholder="model id" />
        <input data-k="endpoint" value="${escapeAttr(m.endpoint)}" placeholder="endpoint" />
        <input data-k="temperature" type="number" step="0.05" value="${m.temperature ?? 0.6}" />
        <input data-k="top_p" type="number" step="0.05" value="${m.top_p ?? 0.9}" />
        <input data-k="max_tokens" type="number" value="${m.max_tokens ?? 4096}" />
        <input data-k="color" value="${escapeAttr(m.color || '#a855f7')}" placeholder="color" />
      </div>
      <div class="key-row">
        <input data-k="apiKey" class="${state.showKeys ? '' : 'key-hidden'}" value="${escapeAttr(keyShown)}" placeholder="API key" />
        <button class="ghost-btn" data-act="toggle-key">${state.showKeys ? 'Hide' : 'Show'}</button>
      </div>
    `;
    // Bind field updates
    card.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        const k = inp.dataset.k;
        if (k === 'temperature' || k === 'top_p' || k === 'max_tokens') {
          m[k] = Number(inp.value);
        } else {
          m[k] = inp.value;
        }
        if (k === 'apiKey' && !state.showKeys) {
          // ignore edits while masked
        }
      });
    });
    card.querySelector('[data-act="toggle-key"]').addEventListener('click', () => {
      state.showKeys = !state.showKeys;
      $('#showKeys').checked = state.showKeys;
      renderModelsConfig();
    });
    grid.appendChild(card);
  }
  wrap.appendChild(grid);
}
async function saveSettings() {
  await api('/api/admin/settings', { method: 'POST', body: {
    showApiKeys: state.showKeys,
    voiceOverlay: $('#voiceToggle').checked,
    theme: $('#themeSel').value
  }});
  toast('Settings saved', 'ok');
}
async function saveConfig() {
  // Make sure apiKey wasn't blanked by mask
  for (const m of state.config.models) {
    if (m.apiKey && /^•+$/.test(m.apiKey)) m.apiKey = '';
  }
  await api('/api/admin/config', { method: 'POST', body: { models: state.config.models } });
  await loadModels();
  toast('Models saved', 'ok');
}
async function savePrompt() {
  state.config.systemPrompt = $('#systemPrompt').value;
  await api('/api/admin/config', { method: 'POST', body: { systemPrompt: $('#systemPrompt').value } });
  toast('System prompt saved', 'ok');
}
async function saveAdmin() {
  const u = $('#adminUser').value.trim();
  const p = $('#adminPass').value;
  if (!u || !p) { toast('Username & password required', 'error'); return; }
  await api('/api/admin/config', { method: 'POST', body: { admin: { username: u, password: p } } });
  toast('Admin credentials updated', 'ok');
}

// ----- Threads -----
function loadThreads() {
  try { state.threads = JSON.parse(localStorage.getItem('lobby_threads') || '[]'); }
  catch { state.threads = []; }
  state.activeThread = state.threads[0]?.id || null;
  renderThreads();
  if (state.activeThread) loadActiveThread();
}
function saveThreads() { localStorage.setItem('lobby_threads', JSON.stringify(state.threads.slice(0, 50))); }
function newThread() {
  const t = { id: 't_' + Date.now().toString(36), title: 'New chat', model: state.activeModel, messages: [], created: Date.now() };
  state.threads.unshift(t);
  state.activeThread = t.id;
  saveThreads(); renderThreads(); loadActiveThread();
  focusInput();
}
function renderThreads() {
  const list = $('#threadList');
  list.innerHTML = '';
  for (const t of state.threads) {
    const el = document.createElement('div');
    el.className = 'thread-item' + (t.id === state.activeThread ? ' active' : '');
    el.innerHTML = `<span>${escapeHtml(t.title)}</span><span class="del">×</span>`;
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('del')) { deleteThread(t.id); return; }
      state.activeThread = t.id; renderThreads(); loadActiveThread();
    });
    list.appendChild(el);
  }
}
function deleteThread(id) {
  state.threads = state.threads.filter(t => t.id !== id);
  if (state.activeThread === id) state.activeThread = state.threads[0]?.id || null;
  saveThreads(); renderThreads(); loadActiveThread();
}
function loadActiveThread() {
  const t = state.threads.find(x => x.id === state.activeThread);
  const wrap = $('#messages');
  wrap.innerHTML = '';
  if (!t || !t.messages?.length) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-glyph">✦</div>
        <h1>Welcome to the Lobby</h1>
        <p>Two NVIDIA models · agentic tools · vector memory · voice overlay · web scrape · file ops · terminal access.</p>
        <div class="empty-chips">
          <button class="chip" data-insert="Give me a 3-bullet briefing on today's weather in Tokyo.">Weather in Tokyo</button>
          <button class="chip" data-insert="Scrape https://example.com and tell me what's on it.">Scrape example.com</button>
          <button class="chip" data-insert="Remember: my favorite color is ultraviolet. Then recall it.">Test memory</button>
          <button class="chip admin-only" data-insert="Run \`uname -a\` and \`ls -la\` in the workspace." hidden>Run a command</button>
        </div>
      </div>`;
    $$('.empty-chips .chip, .ghost-btn[data-insert]').forEach(b => b.addEventListener('click', () => {
      $('#input').value = b.dataset.insert || ''; autoSize(); sendMessage();
    }));
    return;
  }
  for (const m of t.messages) addBubble(m.role, m.content, false, m.meta);
  scrollToEnd();
}
function clearCurrentThread() {
  const t = state.threads.find(x => x.id === state.activeThread);
  if (!t) { toast('No active thread', 'error'); return; }
  if (!confirm('Clear messages in this thread?')) return;
  t.messages = [];
  saveThreads();
  loadActiveThread();
  toast('Thread cleared', 'ok');
}

function exportThread() {
  const t = state.threads.find(x => x.id === state.activeThread);
  if (!t) return;
  const blob = new Blob([t.messages.map(m => `## ${m.role}\n\n${m.content}`).join('\n\n---\n\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${t.title || 'chat'}.md`; a.click();
  URL.revokeObjectURL(url);
}

// ----- Composer -----
function autoSize() {
  const t = $('#input');
  t.style.height = 'auto';
  t.style.height = Math.min(200, t.scrollHeight) + 'px';
}
function onInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}
function focusInput() { setTimeout(() => $('#input').focus(), 50); }

// ----- Send / stream -----
function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  state.ws = ws;
  ws.addEventListener('open', () => setConn('ok'));
  ws.addEventListener('close', () => { setConn('err'); setTimeout(connectWS, 1500); });
  ws.addEventListener('error', () => setConn('err'));
  ws.addEventListener('message', (ev) => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.type === 'delta') onDelta(msg);
    else if (msg.type === 'done') onDone(msg);
    else if (msg.type === 'error') onError(msg);
    else if (msg.type === 'tts_cue') onTTSCue(msg);
  });
}
function setConn(kind) {
  const s = $('#connStatus');
  s.classList.remove('ok', 'err'); s.classList.add(kind);
  s.innerHTML = `<span class="dot"></span> ${kind === 'ok' ? 'connected' : (kind === 'err' ? 'disconnected' : 'connecting…')}`;
}
function scrollToEnd() { const m = $('#messages'); m.scrollTop = m.scrollHeight; }

function ensureThread() {
  let t = state.threads.find(x => x.id === state.activeThread);
  if (!t) {
    t = { id: 't_' + Date.now().toString(36), title: 'New chat', model: state.activeModel, messages: [], created: Date.now() };
    state.threads.unshift(t);
    state.activeThread = t.id;
    saveThreads(); renderThreads();
  }
  return t;
}

function sendMessage() {
  const text = $('#input').value.trim();
  if (!text || !state.ws || state.ws.readyState !== 1) return;
  if (state.currentRun) return;
  const t = ensureThread();
  // clear empty state
  if (!$('#messages').querySelector('.msg')) $('#messages').innerHTML = '';
  addBubble('user', text);
  t.messages.push({ role: 'user', content: text });
  if (t.title === 'New chat') t.title = text.slice(0, 40) + (text.length > 40 ? '…' : '');
  saveThreads(); renderThreads();
  $('#input').value = ''; autoSize();

  // assistant placeholder
  const aBubble = addBubble('assistant', '', true);
  const ttsBuf = [];
  state.currentRun = { bubble: aBubble, transcript: [], ttsBuf };

  // Strip internal memories block from outgoing messages? No, we keep history clean
  const history = t.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
  // include up to last 12 turns for context
  const trimmed = history.slice(-12);
  trimmed.push({ role: 'user', content: text });
  state.ws.send(JSON.stringify({ type: 'chat', modelId: state.activeModel, messages: trimmed, voice: state.voiceOverlay }));
}

let pendingToolRender = null;
function onDelta(msg) {
  const run = state.currentRun; if (!run) return;
  const { bubble } = run;
  if (msg.meta?.tool) {
    // Render a tool trace line
    if (!run.toolEl) {
      run.toolEl = document.createElement('div');
      run.toolEl.className = 'msg tool';
      run.toolEl.innerHTML = `<div class="avatar">⚙</div><div class="bubble"></div>`;
      $('#messages').appendChild(run.toolEl);
    }
    const tb = run.toolEl.querySelector('.bubble');
    tb.textContent += msg.delta.replace(/\n+$/g, '\n');
    scrollToEnd();
    return;
  }
  if (!run.textEl) {
    run.textEl = bubble.querySelector('.body') || bubble;
  }
  // Append raw text
  run._raw = (run._raw || '') + msg.delta;
  const html = renderMarkdown(run._raw);
  bubble.innerHTML = `<div class="body">${html}</div>`;
  // remove cursor
  bubble.classList.remove('cursor');
  scrollToEnd();
  run.ttsBuf.push(msg.delta);
}

function onDone(msg) {
  const run = state.currentRun;
  if (run) {
    const t = ensureThread();
    t.messages.push({ role: 'assistant', content: msg.text || run._raw || '' });
    saveThreads();
    // Auto refresh memory list occasionally
    if (msg.transcript?.some(x => x.tool === 'memory_store')) loadMemory();
  }
  state.currentRun = null;
  focusInput();
}
function onError(msg) {
  toast('AI error: ' + msg.error, 'error');
  state.currentRun = null;
  focusInput();
}
function onTTSCue(msg) {
  if (!state.voiceOverlay) return;
  if (!('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(msg.text.replace(/\[\[TOOL:[\s\S]*?\]\]/g, '').replace(/[*_`#]/g, ''));
    u.rate = 1.05; u.pitch = 1;
    speechSynthesis.speak(u);
  } catch {}
}

function addBubble(role, content, streaming=false, meta) {
  const wrap = $('#messages');
  const el = document.createElement('div');
  el.className = 'msg ' + role + (streaming ? ' cursor' : '');
  const avatar = role === 'user' ? 'You' : 'AI';
  el.innerHTML = `<div class="avatar">${avatar}</div><div class="bubble"></div>`;
  const b = el.querySelector('.bubble');
  if (content) b.innerHTML = `<div class="body">${renderMarkdown(content)}</div>`;
  wrap.appendChild(el);
  if (!streaming) scrollToEnd();
  return el;
}

function renderMarkdown(text) {
  if (!text) return '';
  // strip tool calls from display
  const cleaned = text.replace(/\[\[TOOL:[^\]]*\]\]/g, '');
  try {
    const html = window.marked.parse(cleaned, { breaks: true, gfm: true });
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
  } catch {
    return escapeHtml(cleaned);
  }
}

// ----- Voice hold-to-talk -----
let recognition = null;
let recognizing = false;
function ensureRecognition() {
  if (recognition) return recognition;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.onresult = (e) => {
    let txt = '';
    for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
    const cur = $('#input').value;
    $('#input').value = (cur && !cur.endsWith(' ') ? cur + ' ' : cur) + txt;
    autoSize();
  };
  recognition.onend = () => { recognizing = false; $('#micBtn').style.color = ''; };
  recognition.onerror = () => { recognizing = false; $('#micBtn').style.color = ''; };
  return recognition;
}
function startVoiceHold() {
  const r = ensureRecognition();
  if (!r) { toast('Speech recognition not supported in this browser', 'error'); return; }
  try { r.start(); recognizing = true; $('#micBtn').style.color = '#ec4899'; }
  catch { /* already started */ }
}
function stopVoiceHold() {
  if (recognition && recognizing) { try { recognition.stop(); } catch {} }
}

// ----- Voice overlay (push-to-talk full screen) -----
let voiceSession = null;
function openVoiceOverlay() {
  $('#voiceOverlay').hidden = false;
  $('#voiceCaption').textContent = 'Tap the orb to start · say "stop" to end';
  $('#voiceTranscript').textContent = '';
}
function closeVoiceOverlay() {
  stopVoiceSession();
  $('#voiceOverlay').hidden = true;
}
function toggleVoiceSession() {
  if (voiceSession) stopVoiceSession(); else startVoiceSession();
}
function startVoiceSession() {
  const r = ensureRecognition();
  if (!r) { toast('Speech recognition not supported', 'error'); return; }
  voiceSession = { active: true, buffer: '' };
  $('#voiceCaption').textContent = 'Listening… speak naturally';
  r.continuous = true;
  r.interimResults = true;
  r.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t; else interim += t;
    }
    if (final) {
      voiceSession.buffer += final;
      if (/stop|exit|close/i.test(final)) { stopVoiceSession(); return; }
      $('#voiceTranscript').textContent = voiceSession.buffer;
      // Send to AI
      sendVoiceTurn(final);
    } else if (interim) {
      $('#voiceTranscript').textContent = voiceSession.buffer + interim;
    }
  };
  r.onend = () => {
    if (voiceSession?.active) {
      try { r.start(); } catch { stopVoiceSession(); }
    }
  };
  try { r.start(); } catch (e) { toast(String(e), 'error'); }
}
function stopVoiceSession() {
  if (recognition) { try { recognition.stop(); } catch {} }
  if (voiceSession) { voiceSession.active = false; voiceSession = null; }
  $('#voiceCaption').textContent = 'Tap the orb to start · say "stop" to end';
}
function sendVoiceTurn(text) {
  // Pipe through normal chat pipeline
  const t = ensureThread();
  if (!$('#messages').querySelector('.msg')) $('#messages').innerHTML = '';
  addBubble('user', text);
  t.messages.push({ role: 'user', content: text });
  saveThreads();
  const aBubble = addBubble('assistant', '', true);
  state.currentRun = { bubble: aBubble, transcript: [], ttsBuf: [] };
  const history = t.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })).slice(-12);
  history.push({ role: 'user', content: text });
  state.ws.send(JSON.stringify({ type: 'chat', modelId: state.activeModel, messages: history, voice: true }));
}

// ----- File manager -----
async function loadFiles() {
  if (!state.isAdmin) { $('#fileList').innerHTML = '<div class="file-empty">Admin only.</div>'; return; }
  const res = await api(`/api/files?path=${encodeURIComponent(state.filePath)}`);
  if (!res.ok) { $('#fileList').innerHTML = `<div class="file-empty">${escapeHtml(res.error || 'error')}</div>`; return; }
  const list = $('#fileList');
  list.innerHTML = '';
  $('#filesCrumb').textContent = res.path || '/';
  for (const it of res.items) {
    const row = document.createElement('div');
    row.className = 'file-row dir';
    row.innerHTML = `
      <span>${it.type === 'dir' ? '📁' : '📄'}</span>
      <span class="nm">${escapeHtml(it.name)}</span>
      <span class="sz">${formatSize(it.size)}</span>
      <span class="mt"><button class="ghost-btn del" title="Delete">×</button></span>`;
    row.addEventListener('click', async (e) => {
      if (e.target.closest('.del')) {
        e.stopPropagation();
        if (!confirm(`Delete ${it.name}?`)) return;
        await api('/api/files/delete', { method: 'POST', body: { path: posixJoin(state.filePath, it.name) } });
        loadFiles(); return;
      }
      if (it.type === 'dir') {
        state.filePath = posixJoin(state.filePath, it.name);
        loadFiles();
      } else {
        openFile(posixJoin(state.filePath, it.name));
      }
    });
    list.appendChild(row);
  }
}
function goFileUp() {
  if (state.filePath === '/' || state.filePath === '') return;
  state.filePath = state.filePath.split('/').slice(0, -1).join('/') || '/';
  loadFiles();
}
function posixJoin(a, b) {
  if (!a || a === '/') return '/' + b;
  return a.replace(/\/$/, '') + '/' + b;
}
async function openFile(p) {
  const res = await api(`/api/files/read?path=${encodeURIComponent(p)}`);
  if (!res.ok) { toast(res.error, 'error'); return; }
  $('#fileView').innerHTML = `
    <div class="file-actions">
      <button class="ghost-btn" id="fvCancel">Close</button>
      <button class="primary-btn" id="fvSave">Save</button>
    </div>
    <textarea id="fvArea" spellcheck="false">${escapeHtml(res.content)}</textarea>
    <div class="file-actions" style="font-size:12px;color:var(--text-faint)">${escapeHtml(p)} · ${formatSize(res.size)}</div>
  `;
  $('#fvCancel').addEventListener('click', () => $('#fileView').innerHTML = '<div class="file-empty">Select a file to preview, or create a new one.</div>');
  $('#fvSave').addEventListener('click', async () => {
    const content = $('#fvArea').value;
    await api('/api/files/write', { method: 'POST', body: { path: p, content } });
    toast('Saved', 'ok');
    loadFiles();
  });
}
async function createFile() {
  const name = prompt('New file name (relative to current dir):');
  if (!name) return;
  const p = posixJoin(state.filePath, name);
  await api('/api/files/write', { method: 'POST', body: { path: p, content: '' } });
  openFile(p); loadFiles();
}
async function createFolder() {
  const name = prompt('New folder name:');
  if (!name) return;
  const p = posixJoin(state.filePath, name);
  await api('/api/files/mkdir', { method: 'POST', body: { path: p } });
  loadFiles();
}
async function uploadFile(file) {
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('path', state.filePath);
  const res = await fetch('/api/files/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
  if (!res.ok) { toast('Upload failed', 'error'); return; }
  toast('Uploaded', 'ok');
  loadFiles();
  $('#filesUpload').value = '';
}
function formatSize(n) {
  if (!n) return '';
  const u = ['B','KB','MB','GB']; let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return n.toFixed(n < 10 && i > 0 ? 1 : 0) + ' ' + u[i];
}

// ----- Terminal -----
async function runTerm(e) {
  e.preventDefault();
  const input = $('#termInput');
  const cmd = input.value.trim();
  if (!cmd) return;
  const out = $('#termOutput');
  out.insertAdjacentHTML('beforeend', `<div class="term-line in">$ ${escapeHtml(cmd)}</div>`);
  input.value = '';
  out.scrollTop = out.scrollHeight;
  try {
    const res = await api('/api/terminal', { method: 'POST', body: { command: cmd } });
    if (res.stdout) out.insertAdjacentHTML('beforeend', `<div class="term-line">${escapeHtml(res.stdout)}</div>`);
    if (res.stderr) out.insertAdjacentHTML('beforeend', `<div class="term-line err">${escapeHtml(res.stderr)}</div>`);
    out.insertAdjacentHTML('beforeend', `<div class="term-line ${res.ok ? 'ok' : 'err'}">— exit ${res.code} —</div>`);
  } catch (err) {
    out.insertAdjacentHTML('beforeend', `<div class="term-line err">${escapeHtml(err.message)}</div>`);
  }
  out.scrollTop = out.scrollHeight;
}

// ----- Utilities -----
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

document.addEventListener('DOMContentLoaded', boot);
