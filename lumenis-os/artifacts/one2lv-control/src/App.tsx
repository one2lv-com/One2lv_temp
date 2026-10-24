import React, { useState, useEffect, useRef } from 'react';

const DISC_FRAMES = ['─────', '── ──', '  ·  ', '── ──', '─────', '── ──', '  ·  ', '── ──'];
const CORE_FRAMES = ['●', '◉', '○', '◉', '●', '◉', '○', '◉'];

interface LogLine { id: number; text: string; type?: 'ok' | 'err' | 'sys'; }

let logSeq = 0;
function mkLog(text: string, type: LogLine['type'] = 'sys'): LogLine {
  return { id: ++logSeq, text, type };
}

export default function App() {
  const [clock, setClock]         = useState('');
  const [view, setView]           = useState<'login' | 'dash'>('login');
  const [username, setUsername]   = useState('one2lv');
  const [password, setPassword]   = useState('');
  const [token, setToken]         = useState('');
  const [logs, setLogs]           = useState<LogLine[]>([mkLog('System ready. NODE 0x73 [SECURED]', 'sys')]);
  const [spinning, setSpinning]   = useState(0);
  const [busy, setBusy]           = useState(false);
  const [loginErr, setLoginErr]   = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  const pushLog = (text: string, type: LogLine['type'] = 'sys') =>
    setLogs(prev => [...prev.slice(-199), mkLog(text, type)]);

  useEffect(() => {
    const saved = localStorage.getItem('one2lv_jwt');
    if (saved) { setToken(saved); setView('dash'); }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setSpinning(s => (s + 1) % 8), 120);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  async function login() {
    setLoginErr('');
    setBusy(true);
    try {
      const res = await fetch(`/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json() as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setLoginErr(data.error ?? 'Auth failed');
      } else {
        localStorage.setItem('one2lv_jwt', data.token);
        setToken(data.token);
        setView('dash');
        pushLog(`[AUTH] ${username} authenticated — session started`, 'ok');
      }
    } catch {
      setLoginErr('Network error');
    } finally {
      setBusy(false);
    }
  }

  async function getStatus() {
    try {
      const res = await fetch(`/api/status`);
      const data = await res.json() as Record<string, string>;
      pushLog(`[STATUS] node:${data.node}  security:${data.security}  status:${data.status}`, 'ok');
      pushLog(`[STATUS] ${data.equation ?? ''}  ts:${data.timestamp}`, 'sys');
    } catch {
      pushLog('[STATUS] Request failed', 'err');
    }
  }

  async function deploy() {
    setBusy(true);
    try {
      const res = await fetch(`/api/deploy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (data.success) {
        pushLog(`[DEPLOY] ${data.message}`, 'ok');
      } else {
        pushLog(`[DEPLOY] ${data.error ?? 'Failed'}`, 'err');
      }
    } catch {
      pushLog('[DEPLOY] Network error', 'err');
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem('one2lv_jwt');
    setToken('');
    setView('login');
    setLogs([mkLog('Session terminated.', 'sys')]);
  }

  const disc = DISC_FRAMES[spinning];
  const core = CORE_FRAMES[spinning];

  return (
    <div className="cp-root">
      {/* Status bar */}
      <div className="cp-statusbar">
        <span className="cp-clock">{clock}</span>
        <span className="cp-node">NODE 0x73 &nbsp;[{view === 'dash' ? 'SECURED' : 'LOCKED'}]</span>
      </div>

      <div className="cp-body">
        {/* Animated reactor badge */}
        <div className="cp-reactor-badge">
          <span className="cp-disc-line">{disc}{core}{disc}</span>
        </div>

        <h1 className="cp-title">One2lv OS Control Plane</h1>
        <p className="cp-subtitle">= ++ | √∆π ⊃ (+•+³)∆⁹v</p>

        {/* ── LOGIN ── */}
        {view === 'login' && (
          <div className="cp-panel">
            <div className="cp-panel-title">// Authenticate</div>
            <div className="cp-hierarchy">
              System · Center · Disc · Saturn · Solar System · Milky Way · Sagittarius A* · Singularity
            </div>
            <input
              className="cp-input"
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
            />
            <input
              className="cp-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
            />
            {loginErr && <div className="cp-error">{loginErr}</div>}
            <button className="cp-btn cp-btn-primary" onClick={login} disabled={busy}>
              {busy ? 'Authenticating...' : 'Access Node'}
            </button>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {view === 'dash' && (
          <>
            <div className="cp-panel">
              <div className="cp-panel-title">// Commands</div>
              <div className="cp-btn-grid">
                <button className="cp-btn" onClick={getStatus}>Ping Status</button>
                <button className="cp-btn cp-btn-deploy" onClick={deploy} disabled={busy}>
                  {busy ? 'Deploying...' : 'Trigger Deploy'}
                </button>
              </div>

              {/* Cosmic hierarchy */}
              <div className="cp-cosmic-grid">
                {[
                  ['~', 'wave', '/ oscillation / passing motion'],
                  ['|', 'axis', '/ stake / fixed reference'],
                  ['π', 'disc', '/ rotation / orbit'],
                  ['√', 'root', '/ base magnitude'],
                  ['=', 'result', '/ resolved state / outcome'],
                  ['∆', 'change', '/ transformation / gradient'],
                  ['•', 'node', '/ interaction / coupling'],
                  ['v', 'vector', '/ directed motion'],
                ].map(([sym, label, rest]) => (
                  <div key={sym} className="cp-sym-row">
                    <span className="cp-sym">{sym}</span>
                    <span className="cp-sym-label">{label}</span>
                    <span className="cp-sym-rest">{rest}</span>
                  </div>
                ))}
              </div>

              {/* Dynamics flow */}
              <div className="cp-dynamics">
                <span>compression</span>
                <span className="cp-arrow">→</span>
                <span>limit</span>
                <span className="cp-arrow">→</span>
                <span>singularity</span>
              </div>

              {/* Triadic */}
              <div className="cp-triadic">
                <span className="cp-tri-c">▲ </span>
                <span className="cp-tri-p">▲ </span>
                <span className="cp-tri-c">▲</span>
                <span className="cp-tri-eq"> = 6</span>
              </div>
            </div>

            {/* Output stream */}
            <div className="cp-panel">
              <div className="cp-panel-title">// Output Stream</div>
              <div className="cp-log" ref={logRef}>
                {logs.map(l => (
                  <div key={l.id} className={`cp-log-line ${l.type ?? 'sys'}`}>
                    {l.text}
                  </div>
                ))}
              </div>
              <button className="cp-btn cp-btn-term" onClick={logout}>Terminate Session</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
