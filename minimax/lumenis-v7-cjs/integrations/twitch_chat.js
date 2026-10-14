const msgs = [];

module.exports = {
  add:    (u, t) => { const m = { u, t, ts: Date.now() }; msgs.push(m); if (msgs.length > 100) msgs.shift(); return m; },
  recent: (n = 10) => msgs.slice(-n),
  search: (kw) => msgs.filter(m => m.t.toLowerCase().includes(kw.toLowerCase()))
};
