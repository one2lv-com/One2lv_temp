// AI Broadcaster - Real-time commentary and stream enhancement
// Provides play-by-play, analysis, and entertainment commentary

import { broadcast } from '../mesh/mesh.js';
import { storeMemory } from '../core/memory.js';

// Commentary styles
const STYLES = {
  hype: {
    opener: ['🔥 LET\'S GO!', '⚡ INCREDIBLE!', '🎯 THAT\'S ELITE!'],
    mid: ['NAILED IT!', 'PURE SKILL!', 'TEXTBOOK!'],
    closer: ['END OF STORY!', 'CASE CLOSED!', 'DOMINANT!']
  },
  analytical: {
    opener: ['Calculated decision.', 'Strategic choice.', 'Reading the game.'],
    mid: ['Key positioning.', 'Frame advantage earned.', 'Mental stack applied.'],
    closer: ['High percentage play.', 'Pattern exploited.', 'System executing.']
  },
  chill: {
    opener: ['Nice setup.', 'Smooth operator.', 'Clean sequence.'],
    mid: ['Patient execution.', 'Flow state activated.', 'Composure maintained.'],
    closer: ['Textbook execution.', 'Poised performance.', 'Controlled aggression.']
  },
  hypeMan: {
    opener: ['YEAH BOIIII!', 'WE\'RE WITNESSING GREATNESS!', 'THIS IS SPECIAL!'],
    mid: ['HE DOES IT AGAIN!', 'UNREAL!', 'HISTORY RIGHT THERE!'],
    closer: ['ABSOLUTE MONSTER!', 'LEGENDARY!', 'THE BEST IN THE GAME!']
  }
};

// Key moments to commentate
const KEY_MOMENTS = {
  'first_blood': 'First blood secured! The psychological advantage begins.',
  'combo': 'Consecutive hits connecting! The opponent cannot breathe!',
  'kill': 'STOCK DOWN! The board state shifts dramatically!',
  'comeback': 'The comeback is real! Deficit erased through sheer will!',
  'clutch': 'Clutch factor engaged! This is what separates the great from the rest!',
  'close_call': 'That was CLOSE! Blast zone danger averted!',
  'edge_guard': 'Stage control at its finest! No mercy at the edge!',
  'neutral_win': 'Neutral won decisively. Positioning secured.',
  'punish': 'Whiff punished! The opening was created and converted!',
  'streak': 'Unstoppable momentum! The streak continues!'
};

// Stream overlay data
let streamData = {
  player1: { name: 'Player 1', stocks: 3, percent: 0 },
  player2: { name: 'Player 2', stocks: 3, percent: 0 },
  currentAction: '',
  commentary: '',
  hype: 0
};

// Generate play-by-play commentary
export function generateCommentary(action, gameState) {
  const { type, data } = action;
  const { player1, player2 } = gameState;

  // Determine hype level
  let hypeLevel = calculateHypeLevel(gameState);

  // Select commentary style based on hype
  const style = hypeLevel > 7 ? 'hype' : hypeLevel > 4 ? 'analytical' : 'chill';
  const styleSet = STYLES[style];

  // Generate commentary
  let commentary = {
    type: 'commentary',
    moment: '',
    lines: [],
    overlay: {},
    hype: hypeLevel
  };

  // Add key moment detection
  const moment = detectKeyMoment(action, gameState);
  if (moment) {
    commentary.moment = moment;
    commentary.lines.push(styleSet.opener[Math.floor(Math.random() * styleSet.opener.length)]);
    commentary.lines.push(KEY_MOMENTS[moment]);
  }

  // Action-specific commentary
  switch (type) {
    case 'attack':
      commentary.lines.push(generateAttackCommentary(data, styleSet));
      commentary.overlay = { action: 'ATTACK', player: data.player };
      break;

    case 'dodge':
      commentary.lines.push(generateDodgeCommentary(data, styleSet));
      commentary.overlay = { action: 'DODGE', player: data.player };
      break;

    case 'jump':
      commentary.lines.push(generateJumpCommentary(data, styleSet));
      commentary.overlay = { action: 'JUMP', player: data.player };
      break;

    case 'land':
      commentary.lines.push(generateLandingCommentary(data, styleSet));
      commentary.overlay = { action: 'LAND', player: data.player };
      break;

    case 'damage':
      const damageAmount = data.damage || 0;
      commentary.lines.push(generateDamageCommentary(damageAmount, data.target, styleSet));
      commentary.overlay = { action: 'DMG', player: data.target, percent: data.percent };
      break;

    case 'ko':
      commentary.lines.push(generateKOCommentary(data, gameState));
      commentary.moment = 'kill';
      commentary.overlay = { action: 'KO', winner: data.winner };
      break;

    case 'recovery':
      commentary.lines.push(generateRecoveryCommentary(data, styleSet));
      commentary.overlay = { action: 'RECOVERY', player: data.player };
      break;
  }

  // Close with style
  if (commentary.lines.length > 0) {
    commentary.lines.push(styleSet.closer[Math.floor(Math.random() * styleSet.closer.length)]);
  }

  // Update stream data
  streamData = {
    ...streamData,
    player1,
    player2,
    currentAction: type,
    commentary: commentary.lines.join(' '),
    hype: hypeLevel
  };

  // Broadcast to mesh
  broadcast({
    type: 'stream_update',
    data: streamData
  });

  // Store for memory
  storeMemory(
    `Commentary: ${type} - ${commentary.lines.join(' ')}`,
    'broadcaster'
  );

  return commentary;
}

// Calculate hype level (0-10)
function calculateHypeLevel(gameState) {
  let hype = 5;

  const { player1, player2 } = gameState;

  // Stock difference
  const stockDiff = Math.abs(player1.stocks - player2.stocks);
  if (stockDiff >= 2) hype += 2;

  // Percentage danger
  if (player1.percent > 100 || player2.percent > 100) hype += 2;
  if (player1.percent > 150 || player2.percent > 150) hype += 1;

  // Close game
  if (player1.stocks === 1 && player2.stocks === 1) hype += 2;

  // Last hit scenario
  const totalStocks = player1.stocks + player2.stocks;
  if (totalStocks === 2 && (player1.percent > 100 || player2.percent > 100)) hype += 2;

  return Math.min(10, hype);
}

// Detect key moments
function detectKeyMoment(action, gameState) {
  const { player1, player2 } = gameState;

  // First blood
  if ((player1.stocks === 3 && player2.stocks < 3) ||
      (player2.stocks === 3 && player1.stocks < 3)) {
    return 'first_blood';
  }

  // KO
  if (action.type === 'ko') {
    return player1.stocks === 1 || player2.stocks === 1 ? 'comeback' : 'kill';
  }

  // High damage combo
  if (action.type === 'damage' && action.data.damage > 40) {
    return 'combo';
  }

  // Edge guard
  if (action.type === 'edge_guard') {
    return 'edge_guard';
  }

  // Clutch dodge
  if (action.type === 'dodge' && gameState.inDanger) {
    return 'close_call';
  }

  return null;
}

// Comment generation helpers
function generateAttackCommentary(data, styleSet) {
  const attackTypes = {
    'light': 'Quick strike!',
    'heavy': 'Devastating blow!',
    'special': 'Signature move executed!',
    'grab': 'Shifts momentum instantly!'
  };

  return attackTypes[data.attackType] || styleSet.mid[Math.floor(Math.random() * styleSet.mid.length)];
}

function generateDodgeCommentary(data, styleSet) {
  if (data.success) {
    return 'Clean evasion! Frame perfect execution!';
  }
  return 'Dodge attempted. Reading the situation.';
}

function generateJumpCommentary(data, styleSet) {
  return 'Vertical positioning activated. Air control matters.';
}

function generateLandingCommentary(data, styleSet) {
  if (data.safe) {
    return 'Landed safely. Neutral retained.';
  }
  return 'Landing caught! Punishable position!';
}

function generateDamageCommentary(damage, target, styleSet) {
  if (damage > 50) {
    return `${damage}% taken! That is CATASTROPHIC!`;
  }
  if (damage > 30) {
    return `${damage}% added. The percentage climbs!`;
  }
  return `${damage}% traded. Trading percentages.`;
}

function generateKOCommentary(data, gameState) {
  const winner = data.winner === 1 ? gameState.player1.name : gameState.player2.name;
  const loserPercent = data.winner === 1 ? gameState.player2.percent : gameState.player1.percent;

  return `${winner} takes the stock at ${loserPercent}%! CHAMPION MOMENT!`;
}

function generateRecoveryCommentary(data, styleSet) {
  if (data.success) {
    return 'Back to stage! Fighting chance maintained!';
  }
  return 'Recovery interrupted! Stage control matters!';
}

// Get current stream overlay data
export function getStreamOverlay() {
  return streamData;
}

// Pre-match commentary
export function preMatchCommentary(player1Name, player2Name) {
  const intro = [
    `The stage is set. ${player1Name} vs ${player2Name}. Let us see who executes better.`,
    `Two warriors enter. One leaves victorious. The battle begins NOW.`,
    `${player1Name} and ${player2Name} face off. The crowd goes wild!`
  ];

  return {
    type: 'prematch',
    lines: [
      STYLES.hype.opener[Math.floor(Math.random() * STYLES.hype.opener.length)],
      intro[Math.floor(Math.random() * intro.length)],
      'READY... FIGHT!'
    ],
    overlay: {
      action: 'MATCH_START',
      player1: player1Name,
      player2: player2Name
    }
  };
}

// Post-match analysis
export function postMatchCommentary(winner, loser, stats) {
  return {
    type: 'postmatch',
    lines: [
      `🏆 ${winner} WINS!`,
      `Congratulations to the victor. Respect to ${loser} for the effort.`,
      'GG. See you next time.'
    ],
    stats: stats,
    overlay: {
      action: 'MATCH_END',
      winner: winner
    }
  };
}

// Get hype meter
export function getHypeMeter() {
  return {
    level: streamData.hype,
    bar: '█'.repeat(Math.floor(streamData.hype)) + '░'.repeat(10 - Math.floor(streamData.hype)),
    text: streamData.hype > 7 ? 'MASSIVE!' : streamData.hype > 4 ? 'Building' : 'Cool'
  };
}

export default {
  generateCommentary,
  getStreamOverlay,
  preMatchCommentary,
  postMatchCommentary,
  getHypeMeter
};