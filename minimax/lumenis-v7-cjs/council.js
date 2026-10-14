const EventEmitter = require("events");

class Council extends EventEmitter {}
const council = new Council();

function send(agent, msg, meta = {}) {
  const packet = { time: Date.now(), agent, msg, meta };
  console.log(`[${agent}] ${msg}`);
  council.emit("msg", packet);
  return packet;
}

module.exports = { council, send };
