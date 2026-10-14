let connected = false;

module.exports = {
  autoConnectOBS: async () => {
    console.log("[OBS] Autoconnect enabled - waiting for configuration");
    // In mobile app, OBS connection is optional
    return { connected: false };
  },
  isConnected: () => connected,
  setConnected: (val) => { connected = val; },
  setScene: async (s) => {
    if (connected) console.log("[OBS] Scene set to:", s);
  }
};
