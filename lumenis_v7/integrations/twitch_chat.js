let msgs = [];
module.exports = { add: (u, t) => msgs.push({u, t}), recent: () => msgs.slice(-10) };
