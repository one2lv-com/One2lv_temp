const ADVICE = [
  'Stay resonant. Attack when the frequency aligns.',
  'The opponent is predictable. Break their rhythm.',
  'Pressure the edge. Control the plane.',
  'Wait for the gap. Strike through the axis.',
  'Your energy is high. Maintain the combo chain.',
  'Defensive pattern detected. Bait the counter.',
];
let idx = 0;

export function geminiAdvice(gameState = {}) {
  const advice = ADVICE[idx % ADVICE.length];
  idx++;
  return advice;
}
