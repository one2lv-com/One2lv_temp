const moves = [];

module.exports = {
  record: (m) => { moves.push({ m, ts: Date.now() }); if (moves.length > 50) moves.shift(); },
  predict: (s) => {
    if (moves.length < 3) return "Monitor Patterns";
    const freq = {};
    moves.forEach(x => { freq[x.m] = (freq[x.m] || 0) + 1; });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    return `Predict: ${top?.[0]} (×${top?.[1]}) | Last: ${moves.slice(-3).map(x => x.m).join("→")}`;
  }
};
