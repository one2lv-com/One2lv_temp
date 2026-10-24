import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSupabase, CommandRecord } from '@/hooks/useSupabase';

// --- Types ---
type WindowId = 'terminal' | 'brawlhalla' | 'twitch' | 'telemetry' | 'reactor';

interface TelemetryPoint {
  tag: string;
  baseline: number;
  resonance: number;
  system: string;
  agents: string;
  ts: string;
}

interface WindowState {
  id: WindowId;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Notification {
  id: string;
  title: string;
  body: string;
}

interface LogEntry {
  id: string;
  time: string;
  message: string;
}

// --- Helper Components ---
type ResizeEdge = 'e' | 's' | 'se' | null;

function DraggableWindow({
  winState,
  title,
  icon,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
  children
}: {
  winState: WindowState;
  title: string;
  icon: string;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  children: React.ReactNode;
}) {
  const windowRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });
  const resizeInfo = useRef<{ edge: ResizeEdge; startX: number; startY: number; initW: number; initH: number }>({
    edge: null, startX: 0, startY: 0, initW: 0, initH: 0
  });

  const handleTitleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.titlebar-btn')) return;
    onFocus();
    if (winState.isMaximized) return;
    dragInfo.current.isDragging = true;
    dragInfo.current.startX = e.clientX;
    dragInfo.current.startY = e.clientY;
    dragInfo.current.initialLeft = winState.x;
    dragInfo.current.initialTop = winState.y;
    e.preventDefault();
  };

  const handleResizeMouseDown = (edge: ResizeEdge) => (e: React.MouseEvent) => {
    if (winState.isMaximized) return;
    e.stopPropagation();
    e.preventDefault();
    onFocus();
    resizeInfo.current = { edge, startX: e.clientX, startY: e.clientY, initW: winState.width, initH: winState.height };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragInfo.current.isDragging) {
        const dx = e.clientX - dragInfo.current.startX;
        const dy = e.clientY - dragInfo.current.startY;
        onMove(dragInfo.current.initialLeft + dx, dragInfo.current.initialTop + dy);
      }
      if (resizeInfo.current.edge) {
        const dx = e.clientX - resizeInfo.current.startX;
        const dy = e.clientY - resizeInfo.current.startY;
        const { edge, initW, initH } = resizeInfo.current;
        const newW = edge === 'e' || edge === 'se' ? Math.max(260, initW + dx) : initW;
        const newH = edge === 's' || edge === 'se' ? Math.max(180, initH + dy) : initH;
        onResize(newW, newH);
      }
    };
    const handleMouseUp = () => {
      dragInfo.current.isDragging = false;
      resizeInfo.current.edge = null;
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onMove, onResize]);

  if (!winState.isOpen) return null;

  return (
    <div
      ref={windowRef}
      className={`os-window ${winState.isMinimized ? 'minimized' : ''} ${winState.isMaximized ? 'maximized' : ''}`}
      style={{
        zIndex: winState.zIndex,
        left: winState.isMaximized ? 0 : winState.x,
        top: winState.isMaximized ? 0 : winState.y,
        width: winState.isMaximized ? '100vw' : winState.width,
        height: winState.isMaximized ? 'calc(100vh - 50px)' : winState.height,
        display: winState.isOpen ? 'block' : 'none'
      }}
      onMouseDown={onFocus}
      data-testid={`window-${winState.id}`}
    >
      <div className="titlebar" onMouseDown={handleTitleMouseDown} data-testid={`titlebar-${winState.id}`}>
        <div className="titlebar-left">
          <span className="titlebar-icon">{icon}</span>
          <span>{title}</span>
        </div>
        <div className="titlebar-controls">
          <button className="titlebar-btn btn-minimize" onClick={onMinimize} data-testid={`btn-minimize-${winState.id}`} />
          <button className="titlebar-btn btn-maximize" onClick={onMaximize} data-testid={`btn-maximize-${winState.id}`} />
          <button className="titlebar-btn btn-close" onClick={onClose} data-testid={`btn-close-${winState.id}`} />
        </div>
      </div>
      <div className="os-content">
        {children}
      </div>
      {!winState.isMaximized && (
        <>
          <div className="resize-handle resize-e" onMouseDown={handleResizeMouseDown('e')} data-testid={`resize-e-${winState.id}`} />
          <div className="resize-handle resize-s" onMouseDown={handleResizeMouseDown('s')} data-testid={`resize-s-${winState.id}`} />
          <div className="resize-handle resize-se" onMouseDown={handleResizeMouseDown('se')} data-testid={`resize-se-${winState.id}`} />
        </>
      )}
    </div>
  );
}

// --- Main OS Component ---
export default function LumenisOS() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  
  const [windows, setWindows] = useState<Record<WindowId, WindowState>>({
    terminal:   { id: 'terminal',   isOpen: true,  isMinimized: false, isMaximized: false, zIndex: 150, x: 40,  y: 60,  width: 500, height: 380 },
    brawlhalla: { id: 'brawlhalla', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 100, x: 560, y: 100, width: 400, height: 350 },
    twitch:     { id: 'twitch',     isOpen: false, isMinimized: false, isMaximized: false, zIndex: 100, x: 560, y: 470, width: 400, height: 350 },
    telemetry:  { id: 'telemetry',  isOpen: false, isMinimized: false, isMaximized: false, zIndex: 100, x: 100, y: 120, width: 480, height: 400 },
    reactor:    { id: 'reactor',    isOpen: false, isMinimized: false, isMaximized: false, zIndex: 100, x: 80,  y: 80,  width: 540, height: 540 },
  });

  const [autopilotActive, setAutopilotActive] = useState(false);
  const [bhActive, setBhActive] = useState(false);
  const [twActive, setTwActive] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<React.ReactNode[]>([]);
  const [bhLogs, setBhLogs] = useState<LogEntry[]>([{ id: 'init', time: new Date().toLocaleTimeString(), message: '[SYS] AI Vision model loaded. Awaiting game hook.' }]);
  const [twLogs, setTwLogs] = useState<LogEntry[]>([{ id: 'init', time: new Date().toLocaleTimeString(), message: '[TwitchBot] Connected to channel.' }]);
  const [twViewers, setTwViewers] = useState(0);
  const [twTitle, setTwTitle] = useState('[AI STREAM] Queen Nai Defensive Masterclass');
  const [termInput, setTermInput] = useState('');

  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [telemetryApiStatus, setTelemetryApiStatus] = useState<'UNKNOWN' | 'ONLINE' | 'ERROR'>('UNKNOWN');
  const [heartbeatPulse, setHeartbeatPulse] = useState(false);

  const [councilLogs, setCouncilLogs] = useState<LogEntry[]>([
    { id: 'c0', time: new Date().toLocaleTimeString(), message: '[SYS] Reactor core initialized. Awaiting telemetry.' },
  ]);
  const [comboCount, setComboCount] = useState(0);
  const [reactorSpin, setReactorSpin] = useState(0);
  const reactorSpinRef = useRef(0);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const councilLogsRef = useRef<HTMLDivElement>(null);

  const termOutputRef = useRef<HTMLDivElement>(null);
  const bhLogsRef = useRef<HTMLDivElement>(null);
  const twLogsRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (termOutputRef.current) termOutputRef.current.scrollTop = termOutputRef.current.scrollHeight;
  }, [terminalOutput]);

  useEffect(() => {
    if (bhLogsRef.current) bhLogsRef.current.scrollTop = bhLogsRef.current.scrollHeight;
  }, [bhLogs]);

  useEffect(() => {
    if (twLogsRef.current) twLogsRef.current.scrollTop = twLogsRef.current.scrollHeight;
  }, [twLogs]);

  useEffect(() => {
    if (councilLogsRef.current) councilLogsRef.current.scrollTop = councilLogsRef.current.scrollHeight;
  }, [councilLogs]);

  // Reactor disc spin — 8 frames, rotates every 120 ms
  useEffect(() => {
    const id = setInterval(() => {
      reactorSpinRef.current = (reactorSpinRef.current + 1) % 8;
      setReactorSpin(reactorSpinRef.current);
    }, 120);
    return () => clearInterval(id);
  }, []);

  // Terminal boot message
  useEffect(() => {
    setTerminalOutput([
      <div key="boot1">Welcome to <span style={{ color: 'var(--neon-cyan)' }}>Lumenis OS</span> Terminal</div>,
      <div key="boot2" style={{ color: 'rgba(255,255,255,0.5)' }}>Type 'help' for available commands or 'autopilot' to engage AI.</div>,
      <div key="boot3">&nbsp;</div>
    ]);
  }, []);

  // Checkpoint heartbeat — fires every 15 s, posts to /api/checkpoint
  useEffect(() => {
    const sendCheckpoint = async () => {
      const baseline  = parseFloat((18 + (Math.random() * 2 - 1)).toFixed(3));
      const resonance = parseFloat((73 + (Math.random() * 5)).toFixed(3));
      const point: TelemetryPoint = {
        tag: 'heartbeat',
        baseline,
        resonance,
        system:  'aligned',
        agents:  'active',
        ts:      new Date().toISOString(),
      };
      try {
        const res = await fetch('/api/checkpoint', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            tag:       point.tag,
            baseline:  point.baseline,
            resonance: point.resonance,
            state:     { system: point.system, agents: point.agents },
            timestamp: point.ts,
          }),
        });
        setTelemetryApiStatus(res.ok ? 'ONLINE' : 'ERROR');
      } catch {
        setTelemetryApiStatus('ERROR');
      }
      setHeartbeatPulse(true);
      setTimeout(() => setHeartbeatPulse(false), 500);
      setTelemetryHistory(prev => [...prev.slice(-49), point]);
    };

    const id = setInterval(sendCheckpoint, 15_000);
    sendCheckpoint(); // fire immediately on mount
    return () => clearInterval(id);
  }, []);

  // Window Management functions
  const focusWindow = (id: WindowId) => {
    setWindows(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k as WindowId].zIndex = 100;
      });
      next[id].zIndex = 150;
      return next;
    });
  };

  const openWindow = (id: WindowId) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], isOpen: true, isMinimized: false }
    }));
    focusWindow(id);
  };

  const closeWindow = (id: WindowId) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], isOpen: false } }));
  };

  const toggleMinimize = (id: WindowId) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: !prev[id].isMinimized } }));
  };

  const toggleMaximize = (id: WindowId) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMaximized: !prev[id].isMaximized } }));
  };

  const moveWindow = (id: WindowId, x: number, y: number) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], x, y } }));
  };

  const resizeWindow = useCallback((id: WindowId, width: number, height: number) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], width, height } }));
  }, []);

  // Reactor helpers
  const pushCouncil = (msg: string) => {
    const entry: LogEntry = { id: Date.now().toString(), time: new Date().toLocaleTimeString(), message: msg };
    setCouncilLogs(prev => [...prev.slice(-99), entry]);
  };

  const simulateHit = async () => {
    const newCount = comboCount + 1;
    setComboCount(newCount);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => setComboCount(0), 2200);

    if (newCount >= 3) {
      pushCouncil(`[Lumenis] Combo: ${newCount} hits — resonance amplified`);
    } else {
      pushCouncil(`[Council] Hit registered (${newCount})`);
    }

    try {
      await fetch('/api/checkpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: 'hit', baseline: newCount, resonance: newCount * 7.3, state: { system: 'reactor', agents: 'active' } }),
      });
    } catch { /* network silent fail */ }
  };

  // Notification helper
  const showNotification = (title: string, body: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, title, body }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const appendTerminal = (node: React.ReactNode) => {
    setTerminalOutput(prev => [...prev, node]);
  };

  const appendBhLog = (msg: string) => {
    setBhLogs(prev => [...prev, { id: Date.now().toString(), time: new Date().toLocaleTimeString(), message: msg }]);
  };

  const appendTwLog = (msg: string) => {
    setTwLogs(prev => [...prev, { id: Date.now().toString(), time: new Date().toLocaleTimeString(), message: msg }]);
  };

  // Supabase hooks
  const handleAiCommand = useCallback((record: CommandRecord) => {
    const action = record.action || 'Unknown command';
    appendTerminal(
      <div key={Date.now()}><span style={{ color: 'var(--neon-pink)' }}>[supabase@realtime:~$]</span> Incoming transmission: {action}</div>
    );
    if (record.target === 'brawlhalla') {
      appendBhLog(`[Cloud] ${action}`);
    }
  }, []);

  const { status: supabaseStatus, isSubscribed, insertCommand } = useSupabase(handleAiCommand);

  // Auto-pilot
  const toggleAutoPilot = () => {
    const nextState = !autopilotActive;
    setAutopilotActive(nextState);
    if (nextState) {
      appendTerminal(<div key={Date.now()} style={{ color: 'var(--neon-pink)' }}>[SYSTEM] Lumenis AI given override control. Initiating autonomous loops...</div>);
      showNotification('AI Override', 'System is now fully automated.');
    } else {
      appendTerminal(<div key={Date.now()} style={{ color: '#00ff88' }}>[SYSTEM] Manual control restored.</div>);
    }
  };

  useEffect(() => {
    if (!autopilotActive) return;

    const interval = setInterval(async () => {
      const actions = [
        "[AI] Optimizing WebDAV Rclone ports...",
        "[AI] Syncing Termux filesystem to Cloud...",
        "[AI] Updating Council logic parameters...",
        "[AI] Sentry_Lumen_Alpha handshake verified."
      ];
      const action = actions[Math.floor(Math.random() * actions.length)];
      appendTerminal(<div key={Date.now()} style={{ color: 'var(--neon-purple)' }}>{action}</div>);

      if (bhActive) {
        const events = [
          "Opponent dash-dance detected. Holding center stage.",
          "Executing Spear N-Light to D-Light true combo.",
          "Reading dodge... Punishing with Katar neutral sig.",
          "Maintaining defensive spacing. Waiting for approach."
        ];
        const event = events[Math.floor(Math.random() * events.length)];
        appendBhLog(event);
      }

      if (twActive) {
        setTwViewers(v => Math.max(0, v + Math.floor(Math.random() * 5) - 2));
      }

      insertCommand({ action, target: 'brawlhalla', source: 'autopilot' });

    }, 3500);

    return () => clearInterval(interval);
  }, [autopilotActive, bhActive, twActive, insertCommand]);

  // Terminal input handler
  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = termInput.trim();
      if (!cmd) return;

      appendTerminal(
        <div key={Date.now()}>
          <span className="term-prompt">lumenis@cloud:~$</span> <span className="term-command">{cmd}</span>
        </div>
      );

      if (cmd === 'clear') {
        setTerminalOutput([]);
      } else if (cmd === 'autopilot') {
        toggleAutoPilot();
      } else {
        appendTerminal(<div key={Date.now() + 1} className="term-error">Command recognized by AI Core. Processing...</div>);
      }

      setTermInput('');
    }
  };

  return (
    <>
      <div className="bg-3d">
        <div className="grid-floor"></div>
        <div className="floating-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      </div>

      {/* Terminal Window */}
      <DraggableWindow
        winState={windows.terminal}
        title="Terminal"
        icon="[T]"
        onClose={() => closeWindow('terminal')}
        onMinimize={() => toggleMinimize('terminal')}
        onMaximize={() => toggleMaximize('terminal')}
        onFocus={() => focusWindow('terminal')}
        onMove={(x, y) => moveWindow('terminal', x, y)}
        onResize={(w, h) => resizeWindow('terminal', w, h)}
      >
        <div className="terminal-container">
          <div className="term-output" ref={termOutputRef} data-testid="term-output">
            {terminalOutput.map((node, i) => <React.Fragment key={i}>{node}</React.Fragment>)}
          </div>
          <div className="term-input-row">
            <span className="term-prefix">lumenis@cloud:~$</span>
            <input
              type="text"
              className="term-input"
              value={termInput}
              onChange={e => setTermInput(e.target.value)}
              onKeyDown={handleTerminalKeyDown}
              placeholder="Enter command..."
              autoComplete="off"
              data-testid="term-input"
            />
          </div>
        </div>
      </DraggableWindow>

      {/* Brawlhalla Window */}
      <DraggableWindow
        winState={windows.brawlhalla}
        title="Brawlhalla AI Core"
        icon="[B]"
        onClose={() => closeWindow('brawlhalla')}
        onMinimize={() => toggleMinimize('brawlhalla')}
        onMaximize={() => toggleMaximize('brawlhalla')}
        onFocus={() => focusWindow('brawlhalla')}
        onMove={(x, y) => moveWindow('brawlhalla', x, y)}
        onResize={(w, h) => resizeWindow('brawlhalla', w, h)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div><span style={{ color: 'var(--neon-purple)' }}>Current Legend:</span> Queen Nai</div>
          <div><span style={{ color: 'var(--neon-cyan)' }}>Strategy:</span> Heavy Defense / Spacing</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <button
            className={`os-btn ${bhActive ? 'btn-primary' : ''}`}
            onClick={() => {
              const next = !bhActive;
              setBhActive(next);
              appendBhLog(next ? 'Game hook engaged. Tracking opponent hitboxes.' : 'Game hook disconnected.');
            }}
            style={bhActive ? { background: 'var(--neon-pink)', color: '#fff' } : {}}
            data-testid="btn-bh-hook"
          >
            {bhActive ? 'Disconnect Hook' : 'Engage Game Hook'}
          </button>
          <button
            className="os-btn"
            onClick={() => appendBhLog('Forced defense pattern initiated.')}
            data-testid="btn-bh-def"
          >
            Force Def Stance
          </button>
        </div>
        <div className="log-box" ref={bhLogsRef} data-testid="bh-logs">
          {bhLogs.map(log => (
            <div key={log.id} className="log-entry">
              <span className="log-time">[{log.time}]</span> {log.message}
            </div>
          ))}
        </div>
      </DraggableWindow>

      {/* Twitch Window */}
      <DraggableWindow
        winState={windows.twitch}
        title="Twitch Auto-Broadcaster"
        icon="[S]"
        onClose={() => closeWindow('twitch')}
        onMinimize={() => toggleMinimize('twitch')}
        onMaximize={() => toggleMaximize('twitch')}
        onFocus={() => focusWindow('twitch')}
        onMove={(x, y) => moveWindow('twitch', x, y)}
        onResize={(w, h) => resizeWindow('twitch', w, h)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
          <div>Status: <span style={{ color: twActive ? '#00ff88' : 'var(--neon-pink)' }}>{twActive ? 'LIVE' : 'Offline'}</span></div>
          <div>Viewers: <span style={{ color: 'var(--neon-cyan)' }}>{twViewers}</span></div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={twTitle}
            onChange={e => setTwTitle(e.target.value)}
            placeholder="Stream Title"
            data-testid="input-tw-title"
          />
        </div>
        <button
          className={`os-btn ${twActive ? 'btn-primary' : ''}`}
          onClick={() => {
            const next = !twActive;
            setTwActive(next);
            if (next) {
              setTwViewers(Math.floor(Math.random() * 50) + 12);
              appendTwLog('Stream keyed. OBS Virtual Camera linked.');
            } else {
              setTwViewers(0);
              appendTwLog('Stream offline.');
            }
          }}
          style={{ width: '100%', marginBottom: '15px', ...(twActive ? { background: 'var(--neon-pink)', color: '#fff' } : {}) }}
          data-testid="btn-tw-stream"
        >
          {twActive ? 'End Broadcast' : 'Start Broadcast'}
        </button>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '5px' }}>Chat Relay:</div>
        <div className="log-box" ref={twLogsRef} data-testid="tw-logs">
          {twLogs.map(log => (
            <div key={log.id} className="log-entry">
              <span className="log-time">[{log.time}]</span> {log.message}
            </div>
          ))}
        </div>
      </DraggableWindow>

      {/* Telemetry Window */}
      <DraggableWindow
        winState={windows.telemetry}
        title="Telemetry Monitor"
        icon="[M]"
        onClose={() => closeWindow('telemetry')}
        onMinimize={() => toggleMinimize('telemetry')}
        onMaximize={() => toggleMaximize('telemetry')}
        onFocus={() => focusWindow('telemetry')}
        onMove={(x, y) => moveWindow('telemetry', x, y)}
        onResize={(w, h) => resizeWindow('telemetry', w, h)}
      >
        {/* Status bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '11px' }}>
          <div>
            <span style={{ opacity: 0.5 }}>API  </span>
            <span style={{ color: telemetryApiStatus === 'ONLINE' ? '#00ff88' : telemetryApiStatus === 'ERROR' ? 'var(--neon-pink)' : 'rgba(255,255,255,0.4)' }}>
              {telemetryApiStatus}
            </span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: heartbeatPulse ? '#00ff88' : 'rgba(0,255,136,0.25)', transition: 'background 0.2s' }} />
            <span style={{ opacity: 0.5 }}>HB</span>
          </div>
        </div>

        {/* Live readings */}
        {telemetryHistory.length > 0 && (() => {
          const last = telemetryHistory[telemetryHistory.length - 1];
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(0,255,204,0.06)', borderRadius: '6px', padding: '10px', border: '1px solid rgba(0,255,204,0.15)' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>Baseline</div>
                <div style={{ color: 'var(--neon-cyan)', fontSize: '22px', fontWeight: 700 }}>{last.baseline.toFixed(3)}</div>
              </div>
              <div style={{ background: 'rgba(191,95,255,0.06)', borderRadius: '6px', padding: '10px', border: '1px solid rgba(191,95,255,0.2)' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>Resonance Hz</div>
                <div style={{ color: 'var(--neon-purple)', fontSize: '22px', fontWeight: 700 }}>{last.resonance.toFixed(3)}</div>
              </div>
            </div>
          );
        })()}

        {/* Checkpoint log */}
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>Checkpoint log ({telemetryHistory.length})</div>
        <div className="log-box" data-testid="telemetry-log">
          {[...telemetryHistory].reverse().slice(0, 20).map((p, i) => (
            <div key={i} className="log-entry" style={{ display: 'flex', gap: '8px' }}>
              <span className="log-time">{new Date(p.ts).toLocaleTimeString()}</span>
              <span style={{ color: 'var(--neon-cyan)' }}>b:{p.baseline.toFixed(2)}</span>
              <span style={{ color: 'var(--neon-purple)' }}>r:{p.resonance.toFixed(2)}</span>
              <span style={{ marginLeft: 'auto', color: '#00ff88', fontSize: '10px' }}>ok</span>
            </div>
          ))}
          {telemetryHistory.length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Awaiting first heartbeat...</div>
          )}
        </div>
      </DraggableWindow>

      {/* Reactor Core Window */}
      {(() => {
        const discFrames = ['─────', '── ──', '  ·  ', '── ──', '─────', '── ──', '  ·  ', '── ──'];
        const coreFrames = ['●', '◉', '○', '◉', '●', '◉', '○', '◉'];
        const disc = discFrames[reactorSpin];
        const core = coreFrames[reactorSpin];
        const isCombo = comboCount >= 3;
        return (
          <DraggableWindow
            winState={windows.reactor}
            title="Reactor Core — Lumenis v7"
            icon="[R]"
            onClose={() => closeWindow('reactor')}
            onMinimize={() => toggleMinimize('reactor')}
            onMaximize={() => toggleMaximize('reactor')}
            onFocus={() => focusWindow('reactor')}
            onMove={(x, y) => moveWindow('reactor', x, y)}
            onResize={(w, h) => resizeWindow('reactor', w, h)}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>

              {/* Axis diagram */}
              <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.55', textAlign: 'center', padding: '12px 8px', background: 'rgba(0,255,204,0.04)', border: '1px solid rgba(0,255,204,0.12)', borderRadius: '6px' }}>
                <div style={{ color: 'rgba(255,255,255,0.25)' }}>N</div>
                <div style={{ color: 'rgba(255,255,255,0.25)' }}>|</div>
                <div style={{ color: 'var(--neon-purple)', opacity: 0.7 }}>{'\\  |  /'}</div>
                <div style={{ color: 'var(--neon-purple)', opacity: 0.85 }}>{'\\ | /'}</div>
                <div style={{ color: 'var(--neon-purple)' }}>{'\\|/'}</div>
                <div style={{ color: 'var(--neon-cyan)', fontWeight: 700, letterSpacing: '0.05em' }}>{`${disc}${core}${disc}`}</div>
                <div style={{ color: 'var(--neon-purple)' }}>{'/|\\'}</div>
                <div style={{ color: 'var(--neon-purple)', opacity: 0.85 }}>{'/ | \\'}</div>
                <div style={{ color: 'var(--neon-purple)', opacity: 0.7 }}>{'/  |  \\'}</div>
                <div style={{ color: 'rgba(255,255,255,0.25)' }}>|</div>
                <div style={{ color: 'rgba(255,255,255,0.25)' }}>S</div>
              </div>

              {/* Symbol legend */}
              <div style={{ padding: '12px', background: 'rgba(191,95,255,0.04)', border: '1px solid rgba(191,95,255,0.14)', borderRadius: '6px' }}>
                {[
                  ['~', 'wave / oscillation'],
                  ['|', 'axis / stake / boundary'],
                  ['π', 'disc / rotation / orbit'],
                  ['√', 'root / base magnitude'],
                  ['=', 'resolved state / result'],
                  ['∆', 'change / transformation'],
                  ['•', 'interaction / coupling'],
                  ['v', 'velocity vector'],
                ].map(([sym, desc]) => (
                  <div key={sym} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '11px' }}>
                    <span style={{ color: 'var(--neon-cyan)', fontFamily: 'monospace', minWidth: '14px', fontWeight: 700 }}>{sym}</span>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', lineHeight: '1.3' }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reactor equation */}
            <div style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${isCombo ? 'var(--neon-pink)' : 'rgba(0,255,204,0.2)'}`, borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', textAlign: 'center', transition: 'border-color 0.3s' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.1em' }}>Reactor Equation</div>
              <div style={{ fontFamily: 'monospace', fontSize: '15px', color: isCombo ? 'var(--neon-pink)' : 'var(--neon-cyan)', fontWeight: 700, letterSpacing: '0.05em' }}>
                {'= ++ | √∆π ⊃ (+•+³)∆⁹v'}
              </div>
            </div>

            {/* System dynamics */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '14px', fontSize: '11px', fontFamily: 'monospace' }}>
              {['compression', '→', 'limit', '→', 'singularity'].map((s, i) => (
                <span key={i} style={{ color: i % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'var(--neon-purple)' }}>{s}</span>
              ))}
            </div>

            {/* Triadic partition */}
            <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '14px', marginBottom: '14px', letterSpacing: '0.15em' }}>
              <span style={{ color: 'var(--neon-cyan)' }}>▲ </span>
              <span style={{ color: 'var(--neon-purple)' }}>▲ </span>
              <span style={{ color: 'var(--neon-cyan)' }}>▲</span>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', marginLeft: '10px' }}>= 6</span>
            </div>

            {/* Council log + hit button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase' }}>
                Council Log
                {comboCount > 0 && <span style={{ color: isCombo ? 'var(--neon-pink)' : 'var(--neon-cyan)', marginLeft: '8px' }}>COMBO ×{comboCount}</span>}
              </div>
              <button
                className="os-btn"
                onClick={simulateHit}
                style={{ fontSize: '11px', padding: '3px 10px', ...(isCombo ? { background: 'var(--neon-pink)', color: '#fff', borderColor: 'var(--neon-pink)' } : {}) }}
                data-testid="btn-simulate-hit"
              >
                Simulate Hit
              </button>
            </div>
            <div className="log-box" ref={councilLogsRef} data-testid="reactor-council-log">
              {councilLogs.map(log => (
                <div key={log.id} className="log-entry">
                  <span className="log-time">[{log.time}]</span>{' '}
                  <span style={{ color: log.message.startsWith('[Lumenis]') ? 'var(--neon-pink)' : log.message.startsWith('[SYS]') ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.7)' }}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </DraggableWindow>
        );
      })()}

      {/* Taskbar */}
      <div className="taskbar">
        <div className="taskbar-logo">[*] LUMENIS</div>
        <button className={`dock-btn ${windows.terminal.isOpen && !windows.terminal.isMinimized ? 'active' : ''}`} onClick={() => openWindow('terminal')} data-testid="dock-terminal">[T] Terminal</button>
        <button className={`dock-btn ${windows.brawlhalla.isOpen && !windows.brawlhalla.isMinimized ? 'active' : ''}`} onClick={() => openWindow('brawlhalla')} data-testid="dock-brawlhalla">[B] Brawl AI</button>
        <button className={`dock-btn ${windows.twitch.isOpen && !windows.twitch.isMinimized ? 'active' : ''}`} onClick={() => openWindow('twitch')} data-testid="dock-twitch">[S] Stream</button>
        <button className={`dock-btn ${windows.telemetry.isOpen && !windows.telemetry.isMinimized ? 'active' : ''}`} onClick={() => openWindow('telemetry')} data-testid="dock-telemetry" style={{ position: 'relative' }}>
          [M] Telemetry{heartbeatPulse && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88' }} />}
        </button>
        <button className={`dock-btn ${windows.reactor.isOpen && !windows.reactor.isMinimized ? 'active' : ''}`} onClick={() => openWindow('reactor')} data-testid="dock-reactor">[R] Reactor</button>
        <button
          className="dock-btn"
          onClick={toggleAutoPilot}
          style={{ marginLeft: '20px', borderColor: 'var(--neon-pink)', ...(autopilotActive ? { background: 'var(--neon-pink)', color: '#fff' } : {}) }}
          data-testid="btn-autopilot"
        >
          {autopilotActive ? '[!] Stop Auto-Pilot' : '[A] Enable Auto-Pilot'}
        </button>

        <div className="taskbar-right">
          <div className="status-indicator">
            <div className={`status-dot ${supabaseStatus === 'ACTIVE' ? 'active' : supabaseStatus === 'CONNECTING' ? 'connecting' : 'offline'}`}></div>
            <span>Supabase: {supabaseStatus}</span>
          </div>
          <div className="clock">{time}</div>
        </div>
      </div>

      {/* Notifications */}
      <div className="notifications-container" style={{ position: 'fixed', top: 0, right: 0, zIndex: 3000, pointerEvents: 'none' }}>
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="notification"
              style={{ position: 'relative', marginTop: '20px', pointerEvents: 'auto' }}
            >
              <div className="notification-title">{notif.title}</div>
              <div className="notification-body">{notif.body}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
