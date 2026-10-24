import { EventEmitter } from 'events';

class Council extends EventEmitter {}
const council = new Council();

export function send(agent, msg, meta = {}) {
  const packet = { time: Date.now(), agent, msg, meta };
  console.log(`[${agent}] ${msg}`);
  council.emit('msg', packet);
  return packet;
}

export { council };
export default { council, send };
