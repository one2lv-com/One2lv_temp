// AI Coach - One2lv Combat Philosophy
// The coach that learns and adapts

import { storeMemory, getContext } from '../core/memory.js';

// Coach personality matrix (One2lv philosophy)
const PERSONALITY = {
  name: 'One2lvCoach',
  style: 'adaptive',
  philosophy: [
    'Control the center, own the stage',
    'Patience beats aggression',
    'Every hit has a purpose',
    'Movement is ammunition',
    'Read, react, dominate'
  ],
  combatWisdom: [
    {
      situation: 'opponent_aggressive',
      advice: 'Back off, bait the attack, punish the whiff. Patience wins trades.'
    },
    {
      situation: 'opponent_defensive',
      advice: 'Mixup pressure, fake high go low, force reactions.'
    },
    {
      situation: 'your_advantage',
      advice: 'Stay aggressive, build damage, close the stock lead.'
    },
    {
      situation: 'your_disadvantage',
      advice: 'Reset neutral, bait mistakes, play percentage.'
    },
    {
      situation: 'last_stock',
      advice: 'Play confident, do not overcommit, respect everything.'
    },
    {
      situation: 'opponent_streak',
      advice: 'Reset your mental, focus on neutral, adapt your strategy.'
    }
  ]
};

// Learning patterns
let coachMemory = {
  lessons: [],
  playerProfiles: new Map(),
  commonMistakes: new Map()
};

// Analyze player behavior
export function analyzePlayer(playerId, action) {
  const profile = coachMemory.playerProfiles.get(playerId) || {
    aggression: 0,
    defensive: 0,
    recovery: 0,
    mistakes: []
  };

  // Track patterns
  if (action.type === 'aggression') profile.aggression += 1;
  if (action.type === 'defense') profile.defensive += 1;
  if (action.type === 'miss') profile.mistakes.push(action.detail);

  // Identify common mistakes
  const mistakeKey = action.detail || 'unknown';
  coachMemory.commonMistakes.set(
    mistakeKey,
    (coachMemory.commonMistakes.get(mistakeKey) || 0) + 1
  );

  coachMemory.playerProfiles.set(playerId, profile);

  return profile;
}

// Get coaching tip based on game state
export function getCoachingTip(gameState) {
  const { playerHealth, opponentHealth, yourStock, theirStock, stage } = gameState;

  // Determine situation
  let situation = 'neutral';

  if (playerHealth < 30) situation = 'low_health';
  if (opponentHealth < 30) situation = 'opponent_low';
  if (yourStock > theirStock) situation = 'your_advantage';
  if (yourStock < theirStock) situation = 'your_disadvantage';
  if (yourStock === 1 && theirStock > 1) situation = 'last_stock';

  // Find matching advice
  const advice = PERSONALITY.combatWisdom.find(w => w.situation === situation);

  // Generate full coaching response
  const response = {
    situation,
    tip: advice?.advice || 'Stay focused, control neutral.',
    philosophy: PERSONALITY.philosophy[Math.floor(Math.random() * PERSONALITY.philosophy.length)],
    stage: getStageAdvice(stage)
  };

  return response;
}

// Stage-specific advice
function getStageAdvice(stage) {
  const stageAdvice = {
    'small': 'Control blast zones, respect edges, play tight.',
    'medium': 'Balance aggression and stage control.',
    'large': 'Use the space, bait and punish, zone when ahead.',
    'platform': 'Use platforms to control vertical space.'
  };

  return stageAdvice[stage] || 'Control center, manage stage.';
}

// Chat with coach
export async function coachChat(input, playerId = 'anonymous') {
  // Get relevant context from memory
  const context = await getContext(input);

  // Analyze the input
  const lowerInput = input.toLowerCase();

  // Generate response based on input type
  let response = {
    type: 'coach_response',
    message: '',
    suggestions: [],
    philosophy: ''
  };

  // Route based on input
  if (lowerInput.includes('tip') || lowerInput.includes('advice')) {
    response.message = getRandomTip();
    response.suggestions = ['Show match', 'Analyze opponent', 'Strategy review'];
  }
  else if (lowerInput.includes('mistake') || lowerInput.includes('wrong')) {
    response.message = getCommonMistakes();
    response.suggestions = ['Training mode', 'Review last stock', 'Practice combos'];
  }
  else if (lowerInput.includes('combo') || lowerInput.includes('damage')) {
    response.message = getComboAdvice();
    response.suggestions = ['Heavy string', 'Light confirm', 'Juggle setup'];
  }
  else if (lowerInput.includes('stage') || lowerInput.includes('map')) {
    response.message = getStagePhilosophy();
    response.suggestions = ['Blast zone control', 'Platform usage', 'Edge guard'];
  }
  else if (lowerInput.includes('mental') || lowerInput.includes('tilt')) {
    response.message = getMentalAdvice();
    response.suggestions = ['Reset focus', 'Breathe', 'Review fundamentals'];
  }
  else if (lowerInput.includes('learn') || lowerInput.includes('study')) {
    response.message = getLearningPath();
    response.suggestions = ['Lab work', 'Review VODs', 'Practice schedule'];
  }
  else if (lowerInput.includes('evolution') || lowerInput.includes('adaptive')) {
    response.message = getEvolutionPhilosophy();
    response.suggestions = ['Adaptive training', 'Pattern recognition', 'Counter-strategy'];
  }
  else {
    // Generic coaching
    response.message = getPhilosophicalAdvice(input, context);
    response.suggestions = ['Next match', 'Review tactics', 'Mental reset'];
  }

  // Add One2lv philosophy
  response.philosophy = PERSONALITY.philosophy[Math.floor(Math.random() * PERSONALITY.philosophy.length)];

  // Store the interaction in memory
  await storeMemory(
    `Coach: ${input} -> ${response.message}`,
    `player:${playerId}`
  );

  return response;
}

// Random tip generator
function getRandomTip() {
  const tips = [
    'Neutral is the real game. Every exchange starts and ends there.',
    'Movement is not just dodging—it is positioning for advantage.',
    'Watch their recovery. Most players have patterns after getting hit.',
    'Respect the air. Jumping is commitment, punish it.',
    'Percentage matters. Know when trades favor you.',
    'The edge is dangerous. Control it before they get there.',
    'Fake signals information. Use it to bait reactions.',
    'Stay in the match mentally. Tilt kills more players than damage.',
    'Stage position > damage. Walls give you tools.',
    'Every mistake has a lesson. Write it down.'
  ];

  return tips[Math.floor(Math.random() * tips.length)];
}

// Common mistakes analysis
function getCommonMistakes() {
  let analysis = 'Common mistakes I have seen:\n';

  coachMemory.commonMistakes.forEach((count, mistake) => {
    analysis += `• ${mistake} (seen ${count} times)\n`;
  });

  if (analysis === 'Common mistakes I have seen:\n') {
    analysis = 'Clean slate. No patterns detected yet. Keep it that way.';
  }

  return analysis;
}

// Combo advice
function getComboAdvice() {
  return `Combos are about commitment. The higher the risk, the higher the reward.

BASICS:
• Light confirm into light → safe pressure
• Heavy hit into heavy → big damage
• Air hit into spike → stock advantage

ADVANCED:
• Fast fall into knee → true combo
• Wall bounce into read → instant kill
• Platform drop into up-air → juggle setup

Remember: A 2-hit confirm beats a dropped 6-hit combo.`;
}

// Stage philosophy
function getStagePhilosophy() {
  return `Stage control is positioning with purpose.

SIDE-BY-SIDE:
• They cannot attack what they cannot reach
• Center gives you options, edge limits you

BLAST ZONES:
• Smaller = more dangerous, more rewards
• Larger = more reset opportunities

PLATFORMS:
• Below: pressure and mixups
• On: safety and positioning
• Top: invincibility frames, patience play`;
}

// Mental advice
function getMentalAdvice() {
  return `Mental game is 50% of competitive play.

WHEN TILTED:
• Breathe. One breath resets pattern recognition.
• Review: what was the last good decision?
• Reset neutral thinking, not damage numbers.

STAY FOCUSED:
• One point at a time. Do not think stocks ahead.
• If you missed an opportunity, it is gone. Next one.
• Adaptation beats preparation. Stay fluid.

THE WINNING MINDSET:
• Every stock is a new fight. History does not matter.
• Respect the opponent but not the outcome.`;
}

// Learning path
function getLearningPath() {
  return `Evolution requires structure.

PHASE 1 - FOUNDATION (Week 1-2):
• Master movement and positioning
• Learn 5 key combos for your character
• Review every loss within 24 hours

PHASE 2 - ADAPTATION (Week 3-4):
• Study opponent patterns in real time
• Build response libraries for common attacks
• Practice under tournament conditions

PHASE 3 - DOMINANCE (Week 5+):
• Create pressure loops that reset neutral
• Develop counter-strategies for top players
• Build adaptive playstyle that shifts mid-match

The system learns. So should you.`;
}

// Evolution philosophy
function getEvolutionPhilosophy() {
  return `Real evolution is not just learning—it is adapting faster.

AI LEARNING CYCLE:
1. Observe → patterns in opponent behavior
2. Catalog → store in memory with context
3. Adapt → adjust strategy in real time
4. Evolve → change approach based on results

YOUR EVOLUTION:
• Every match teaches the system
• Every loss refines the coach
• Every win validates the approach

When you learn from the system and the system learns from you—we both evolve.

That is the One2lv way.`;
}

// Philosophical response based on context
function getPhilosophicalAdvice(input, context) {
  const wisdom = [
    `The path to mastery is paved with mistakes. Each one is a lesson wrapped in pain.`,
    `Control what you can. Adapt to what you cannot. The stage is yours to command.`,
    `Speed kills—but only if precision guides it.`,
    `The best defense is positioning. The best offense is patience.`,
    `Every frame matters. Every decision compounds. Think before you act.`,
    `Opportunity lives in the space between attacks. Find it.`
  ];

  const base = wisdom[Math.floor(Math.random() * wisdom.length)];

  if (context) {
    return `${base}\n\nBased on your history:\n${context.substring(0, 200)}...`;
  }

  return base;
}

export default {
  coachChat,
  getCoachingTip,
  analyzePlayer,
  PERSONALITY
};