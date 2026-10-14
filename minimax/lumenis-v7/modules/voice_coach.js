const queue = [];

export function coach(action) {
  const msg = `[COACH] ${action}`;
  console.log(msg);
  queue.push({ msg, ts: Date.now() });
  if (queue.length > 20) queue.shift();
  return msg;
}

export function recent() {
  return queue.slice(-5);
}
