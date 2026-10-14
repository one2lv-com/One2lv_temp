const recentMoves = [];

export function record(move) {
  recentMoves.push({ move, ts: Date.now() });
  if (recentMoves.length > 50) recentMoves.shift();
}

export function predict(gameState = {}) {
  if (recentMoves.length < 3) return 'Insufficient data — monitor patterns.';

  const last3 = recentMoves.slice(-3).map(m => m.move);
  const freq = {};
  recentMoves.forEach(m => { freq[m.move] = (freq[m.move] || 0) + 1; });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];

  return `Predict: ${top?.[0] || 'unknown'} (freq: ${top?.[1] || 0}) | Last 3: ${last3.join(' → ')}`;
}
