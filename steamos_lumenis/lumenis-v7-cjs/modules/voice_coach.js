const queue = [];

module.exports = {
  coach: (action) => {
    const msg = `[COACH] ${action}`;
    console.log(msg);
    queue.push({ msg, ts: Date.now() });
    if (queue.length > 20) queue.shift();
    return msg;
  },
  recent: () => queue.slice(-5)
};
