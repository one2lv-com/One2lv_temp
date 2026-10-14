// Gemini Root — 73.0 Hz · Fresh Mint · Resonance Engine
const ADVICE = [
  "Stay Resonant. Attack when the frequency aligns at 73.0 Hz.",
  "The opponent is predictable. Break their rhythm — Fresh Mint cuts through Nettle.",
  "Pressure the edge. Control the planetary plane.",
  "Wait for the gap. Strike through the axis — the stake reveals the root.",
  "Resonance spike detected. Maintain the combo chain.",
  "Defensive pattern locked. Bait the counter — Jak! forward.",
  "The disc is rotating. Enter on the compression wave.",
  "High-order transformation active. ∆⁹v — vector locked.",
];
let idx = 0;

module.exports = {
  geminiAdvice: () => {
    const a = ADVICE[idx % ADVICE.length];
    idx++;
    return a;
  }
};
