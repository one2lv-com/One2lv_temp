const { OBSWebSocket } = require("obs-websocket-js");
const obs = new OBSWebSocket();
let connected = false;

module.exports = {
  autoConnectOBS: async (host = "localhost", port = 4455, password = "") => {
    try {
      await obs.connect(`ws://${host}:${port}`, password);
      connected = true;
      console.log("OBS WebSocket connected");
      return { connected: true };
    } catch (e) {
      console.log("OBS not available — running without stream control");
      return { connected: false, error: e.message };
    }
  },
  isConnected: () => connected,
  setScene: async (sceneName) => {
    if (!connected) return { ok: false, reason: "OBS not connected" };
    try { await obs.call("SetCurrentProgramScene", { sceneName }); return { ok: true }; }
    catch (e) { return { ok: false, error: e.message }; }
  }
};
