const msgs = [];

export function add(user, text) {
  const m = { user, text, ts: Date.now() };
  msgs.push(m);
  if (msgs.length > 100) msgs.shift();
  return m;
}

export function recent(n = 10) {
  return msgs.slice(-n);
}

export function search(keyword) {
  return msgs.filter(m => m.text.toLowerCase().includes(keyword.toLowerCase()));
}
