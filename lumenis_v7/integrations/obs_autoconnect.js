const { OBSWebSocket } = require("obs-websocket-js");
const obs = new OBSWebSocket();
let connected = false;
module.exports = {
  autoConnectOBS: async () => {
    try {
      await obs.connect();
      connected = true;
      return {connected:true};
    } catch(e) {
      return {connected:false};
    }
  },
  isConnected: () => connected,
  setScene: async (s) => { if(connected) await obs.call("SetCurrentProgramScene", {sceneName:s}); }
};
