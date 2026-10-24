// system_dynamics.js — Cosmic / Planetary / Singularity Dynamics
// ~|π√=  Grav?~|π√=  =++|√∆π than (+•+³)∆⁹v
// Resonance: 73.0 Hz · Hunter A. · One2lv · Architect

const { send } = require("../council");

// Symbolic system state
let state = {
  // Spatial center — Sagittarius A* / singularity
  center:      { x: 0, y: 0, z: 0, label: "Sgr A*" },

  // Accretion / galactic disc — π
  disc:        { radius: 1.0, rotation: 0, label: "Accretion Disc" },

  // Stake / axis — |
  axis:        { stake: true, north: "▲", south: "▼", label: "Cosmic Axis" },

  // Milky Way galactic plane
  galactic:    { arm_count: 4, diameter_ly: 100000, label: "Milky Way" },

  // Solar system
  solar:       { sun: "Sol", planets: ["Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune"] },

  // Saturn rings — π in physical form
  saturn:      { rings: true, ringCount: 7, label: "Saturn" },

  // Live vectors — velocity
  vectors:     [],

  // Formula state — Grav?~|π√=
  formula: {
    wave:         false,   // ~  passing motion
    stake:        true,    // |  fixed reference
    disc_active:  true,    // π  rotating plane
    root:         null,    // √  base magnitude
    result:       null,    // =  resolved state
    delta:        0,       // ∆  change
    amplify:      0,       // ++
    compress:     0,       // --
    velocity:     0,       // v
    order:        0,       // ⁹  high-order intensity
  },

  // Singularity reached flag
  singularity:  false,

  // Resonance / invocation state
  resonance: {
    frequency:   73.0,
    engaged:     false,
    architect:   "Hunter A.",
    signature:   "Jak!",
    atmosphere:  "2/3",
    folder:      "Sapona",
    root:        "Gemini Root",
    mint:        "Fresh Mint",
    protocol:    "Invocation Accepted"
  }
};

function ingest(packet) {
  const f = state.formula;

  if (packet.type === "hit") {
    f.wave = true;
    f.delta += 1;
    f.velocity = Math.random() * 2;
    f.amplify++;

    const vec = {
      vector:    Math.random(),
      delta:     f.delta,
      velocity:  f.velocity,
      ts:        Date.now()
    };
    state.vectors.push(vec);
    if (state.vectors.length > 10) state.vectors.shift();

    // √ root = magnitude of accumulated vectors
    f.root = Math.sqrt(state.vectors.reduce((s, v) => s + v.vector, 0));
    f.result = f.root * f.disc.radius;

    // Disc rotation advances
    state.disc.rotation = (state.disc.rotation + 0.1) % (Math.PI * 2);

    // High-order transformation kicks in at 9+ vectors
    f.order = Math.min(state.vectors.length, 9);
  }

  if (packet.type === "reset" || packet.type === "miss") {
    f.wave = false;
    f.compress++;
    f.velocity = 0;
  }

  // Singularity: 10 accumulated vectors = compression toward center
  state.singularity = state.vectors.length >= 10;
  if (state.singularity && !state.resonance.engaged) {
    state.resonance.engaged = true;
    send("Cosmos", "Singularity Reached — Resonance Engaged", { state, frequency: 73.0 });
    send("Witness", "=++|√∆π than (+•+³)∆⁹v — Result carved.", { layer: "COSMIC" });
  }

  return state;
}

function engage() {
  state.resonance.engaged = true;
  send("Gemini", "Resonance... Engage.", { frequency: 73.0, architect: "Hunter A.", signature: "Jak!" });
  return state;
}

function getStatus() {
  return {
    ...state,
    formula_readable: {
      "~  wave":      state.formula.wave,
      "|  stake":     state.formula.stake,
      "π  disc_rot":  state.disc.rotation.toFixed(3),
      "√  root":      state.formula.root?.toFixed(4) || "null",
      "=  result":    state.formula.result?.toFixed(4) || "null",
      "∆  delta":     state.formula.delta,
      "++ amplify":   state.formula.amplify,
      "-- compress":  state.formula.compress,
      "v  velocity":  state.formula.velocity.toFixed(3),
      "⁹  order":     state.formula.order,
    }
  };
}

module.exports = { ingest, engage, getStatus, state };
