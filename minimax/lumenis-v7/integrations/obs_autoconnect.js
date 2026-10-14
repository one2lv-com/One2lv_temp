import { OBSWebSocket } from 'obs-websocket-js';

const obs = new OBSWebSocket();
let connected = false;

export async function autoConnectOBS(host = 'localhost', port = 4455, password = '') {
  try {
    await obs.connect(`ws://${host}:${port}`, password);
    connected = true;
    console.log('OBS WebSocket connected');
    return { connected: true };
  } catch (e) {
    console.log('OBS not available — running without stream control');
    return { connected: false, error: e.message };
  }
}

export function isConnected() { return connected; }

export async function setScene(sceneName) {
  if (!connected) return { ok: false, reason: 'OBS not connected' };
  try {
    await obs.call('SetCurrentProgramScene', { sceneName });
    return { ok: true, scene: sceneName };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function toggleMic(muted) {
  if (!connected) return { ok: false };
  try {
    await obs.call('SetInputMute', { inputName: 'Mic/Aux', inputMuted: muted });
    return { ok: true, muted };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
