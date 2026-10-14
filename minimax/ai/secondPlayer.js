// AI Second Player - Adaptive fighting opponent with real learning
// Evolves based on player behavior and outcomes

import { storeMemory, getContext } from '../core/memory.js';

// Evolution levels
const EVOLUTION_LEVELS = {
  1: { name: 'Initiate', aggression: 0.3, reactionTime: 800, adaptability: 0.1 },
  2: { name: 'Apprentice', aggression: 0.4, reactionTime: 600, adaptability: 0.2 },
  3: { name: 'Adept', aggression: 0.5, reactionTime: 500, adaptability: 0.3 },
  4: { name: 'Expert', aggression: 0.6, reactionTime: 400, adaptability: 0.4 },
  5: { name: 'Master', aggression: 0.7, reactionTime: 300, adaptability: 0.5 },
  6: { name: 'Grandmaster', aggression: 0.8, reactionTime: 250, adaptability: 0.6 },
  7: { name: 'Champion', aggression: 0.85, reactionTime: 200, adaptability: 0.7 },
  8: { name: 'Legend', aggression: 0.9, reactionTime: 150, adaptability: 0.8 },
  9: { name: 'Mythic', aggression: 0.95, reactionTime: 100, adaptability: 0.9 },
  10: { name: 'One2lv', aggression: 1.0, reactionTime: 50, adaptability: 1.0 }
};

export { EVOLUTION_LEVELS };

// AI Brain state
class AIBrain {
  constructor(playerId = 'ai_player') {
    this.id = playerId;
    this.evolutionLevel = 1;
    this.experience = [];
    this.patterns = new Map();
    this.strategies = new Map();
    this.adaptiveBehavior = {
      defensive: 0.5,
      aggressive: 0.5,
      patient: 0.5,
      risky: 0.5
    };

    this.matchHistory = [];
    this.currentStrategy = 'balanced';

    // Core behaviors
    this.behaviors = {
      attack: this.attackBehavior.bind(this),
      defend: this.defendBehavior.bind(this),
      retreat: this.retreatBehavior.bind(this),
      punish: this.punishBehavior.bind(this),
      zone: this.zoneBehavior.bind(this)
    };
  }

  // Load evolution from experience
  loadEvolution(level) {
    this.evolutionLevel = Math.min(10, Math.max(1, level));
    const stats = EVOLUTION_LEVELS[this.evolutionLevel];

    this.adaptiveBehavior = {
      defensive: 1 - stats.aggression,
      aggressive: stats.aggression,
      patient: 0.5 + stats.adaptability * 0.3,
      risky: stats.adaptability
    };

    return stats;
  }

  // Main decision loop
  async decideAction(gameState, opponentHistory) {
    const levelStats = EVOLUTION_LEVELS[this.evolutionLevel];

    // Analyze opponent patterns
    const opponentPatterns = this.analyzeOpponent(opponentHistory);

    // Determine best strategy
    const strategy = this.selectStrategy(gameState, opponentPatterns);

    // Generate action based on strategy
    const action = await this.executeStrategy(strategy, gameState, opponentPatterns);

    // Learn from action
    this.learn(action, gameState);

    return action;
  }

  // Analyze opponent behavior
  analyzeOpponent(history) {
    if (!history || history.length === 0) {
      return { aggression: 0.5, patterns: [], weaknesses: [] };
    }

    // Track aggression level
    const aggressionCount = history.filter(h => h.type === 'attack' && h.wasSuccessful).length;
    const aggression = aggressionCount / Math.max(history.length, 1);

    // Find common patterns
    const patterns = this.findPatterns(history);

    // Identify weaknesses
    const weaknesses = this.findWeaknesses(history);

    return { aggression, patterns, weaknesses };
  }

  // Find patterns in opponent behavior
  findPatterns(history) {
    const patterns = [];

    // Check for repeated attack sequences
    let lastAction = null;
    let sequence = [];

    history.forEach(h => {
      if (h.type === lastAction) {
        sequence.push(h);
        if (sequence.length >= 3) {
          patterns.push({
            type: 'repeated',
            action: lastAction,
            count: sequence.length
          });
        }
      } else {
        sequence = [h];
      }
      lastAction = h.type;
    });

    // Check for timing patterns
    const timingPatterns = this.findTimingPatterns(history);

    return [...patterns, ...timingPatterns];
  }

  // Find timing patterns
  findTimingPatterns(history) {
    const patterns = [];

    // Find average attack timing
    let lastAttack = null;
    const timings = [];

    history.forEach((h, i) => {
      if (h.type === 'attack') {
        if (lastAttack !== null) {
          timings.push(i - lastAttack);
        }
        lastAttack = i;
      }
    });

    if (timings.length > 0) {
      const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
      if (avg > 0) {
        patterns.push({
          type: 'timing',
          avgInterval: avg,
          predictability: 1 - (Math.std(timings) / avg || 0)
        });
      }
    }

    return patterns;
  }

  // Find opponent weaknesses
  findWeaknesses(history) {
    const weaknesses = [];

    // Check for whiff punishment vulnerability
    const whiffs = history.filter(h => h.type === 'whiff');
    if (whiffs.length > 3) {
      const punishRate = whiffs.filter(w => w.wasPunished).length / whiffs.length;
      if (punishRate > 0.3) {
        weaknesses.push({
          type: 'whiff_punish',
          severity: punishRate,
          strategy: 'bait_whiffs'
        });
      }
    }

    // Check for recovery patterns
    const recoveries = history.filter(h => h.type === 'recovery');
    if (recoveries.length > 0) {
      const failRate = recoveries.filter(r => !r.success).length / recoveries.length;
      if (failRate > 0.4) {
        weaknesses.push({
          type: 'recovery_fail',
          severity: failRate,
          strategy: 'edge_pressure'
        });
      }
    }

    // Check for air game weakness
    const airAttacks = history.filter(h => h.type === 'air_attack' && !h.wasSuccessful);
    if (airAttacks.length > 5) {
      const failRate = airAttacks.length / history.length;
      weaknesses.push({
        type: 'air_game',
        severity: failRate,
        strategy: 'anti_air'
      });
    }

    return weaknesses;
  }

  // Select strategy based on game state
  selectStrategy(gameState, opponentPatterns) {
    const { health, position, stocks, opponentHealth, opponentPosition } = gameState;

    // Adaptability factor
    const adaptability = EVOLUTION_LEVELS[this.evolutionLevel].adaptability;

    // Count favorable conditions
    let score = { aggressive: 0, defensive: 0, patient: 0 };

    // Health advantage
    if (health > opponentHealth + 30) score.aggressive += 2;
    if (health < opponentHealth - 30) score.defensive += 2;

    // Stock advantage
    if (stocks > 1) score.aggressive += 1;
    if (stocks < 1) score.patient += 2;

    // Percentage danger
    if (health > 100) score.defensive += 1;
    if (health > 150) score.defensive += 2;

    // Distance-based
    const distance = Math.abs(position - opponentPosition);
    if (distance > 5) score.patient += 1;
    if (distance < 2) score.aggressive += 1;

    // Exploit opponent weaknesses
    if (opponentPatterns.weaknesses.length > 0) {
      const topWeakness = opponentPatterns.weaknesses[0];
      if (topWeakness.strategy === 'bait_whiffs') score.patient += 2;
      if (topWeakness.strategy === 'edge_pressure') score.aggressive += 2;
      if (topWeakness.strategy === 'anti_air') score.aggressive += 1;
    }

    // Random variation based on evolution level
    if (Math.random() < adaptability * 0.3) {
      const strategies = Object.keys(score);
      this.currentStrategy = strategies[Math.floor(Math.random() * strategies.length)];
    } else {
      // Choose best strategy
      this.currentStrategy = Object.entries(score)
        .sort((a, b) => b[1] - a[1])[0][0];
    }

    return this.currentStrategy;
  }

  // Execute strategy with behavior tree
  async executeStrategy(strategy, gameState, opponentPatterns) {
    const behavior = this.behaviors[strategy] || this.behaviors.attack;

    // Get level stats
    const levelStats = EVOLUTION_LEVELS[this.evolutionLevel];

    // Build action
    const action = await behavior(gameState, opponentPatterns, levelStats);

    // Add evolution-based enhancements
    action.evolutionLevel = this.evolutionLevel;
    action.evolutionName = levelStats.name;

    return action;
  }

  // Behavior: Attack
  async attackBehavior(gameState, patterns, stats) {
    // Predict where opponent will be
    const predictedPos = this.predictPosition(gameState, patterns);

    return {
      type: 'attack',
      subtype: this.selectAttackType(gameState, stats.aggression),
      targetPosition: predictedPos,
      risk: 0.3 + (1 - stats.aggression) * 0.4,
      confidence: 0.6 + stats.adaptability * 0.3
    };
  }

  // Behavior: Defend
  async defendBehavior(gameState, patterns, stats) {
    return {
      type: 'defend',
      dodgeTiming: this.calculateDodgeTiming(gameState),
      position: this.findSafePosition(gameState),
      risk: 0.1,
      confidence: 0.7 + stats.adaptability * 0.2
    };
  }

  // Behavior: Retreat
  async retreatBehavior(gameState, patterns, stats) {
    return {
      type: 'retreat',
      direction: this.getRetreatDirection(gameState),
      recovery: this.shouldRecover(gameState),
      risk: 0.2,
      confidence: 0.8
    };
  }

  // Behavior: Punish
  async punishBehavior(gameState, patterns, stats) {
    // Find punish opportunity
    const punishWindow = this.findPunishWindow(gameState, patterns);

    return {
      type: 'punish',
      target: punishWindow,
      combo: this.selectCombo(gameState, stats.aggression),
      risk: punishWindow.confidence > 0.7 ? 0.2 : 0.5,
      confidence: punishWindow.confidence
    };
  }

  // Behavior: Zone
  async zoneBehavior(gameState, patterns, stats) {
    return {
      type: 'zone',
      spacing: this.calculateOptimalSpacing(gameState),
      projectiles: this.shouldProject(gameState),
      risk: 0.1,
      confidence: 0.75
    };
  }

  // Predict opponent position
  predictPosition(gameState, patterns) {
    let prediction = gameState.opponentPosition;
    let confidence = 0.5;

    // Check for movement patterns
    if (patterns.patterns.length > 0) {
      const timingPattern = patterns.patterns.find(p => p.type === 'timing');
      if (timingPattern) {
        // Predict based on timing
        confidence = timingPattern.predictability;
      }
    }

    // Adjust based on evolution level
    confidence += EVOLUTION_LEVELS[this.evolutionLevel].adaptability * 0.3;

    return { position: prediction, confidence };
  }

  // Select attack type based on situation
  selectAttackType(gameState, aggression) {
    const attacks = ['light', 'heavy', 'special', 'grab'];
    const weights = [0.4, 0.3, 0.2, 0.1];

    // Higher aggression = more heavy attacks
    if (aggression > 0.7) {
      weights[1] += 0.2;
      weights[0] -= 0.1;
    }

    // Random weighted selection
    const rand = Math.random();
    let cumulative = 0;

    for (let i = 0; i < attacks.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        return attacks[i];
      }
    }

    return 'light';
  }

  // Calculate dodge timing
  calculateDodgeTiming(gameState) {
    const reactionTime = EVOLUTION_LEVELS[this.evolutionLevel].reactionTime;

    return {
      delay: reactionTime,
      direction: gameState.opponentPosition > gameState.position ? 'left' : 'right',
      optimal: reactionTime < 200
    };
  }

  // Find safe position
  findSafePosition(gameState) {
    // Stay center when possible
    if (Math.abs(gameState.position) < 3) {
      return { x: 0, safety: 1 };
    }

    // Move toward center if near edge
    return {
      x: gameState.position > 0 ? -1 : 1,
      safety: 0.7
    };
  }

  // Get retreat direction
  getRetreatDirection(gameState) {
    return gameState.opponentPosition > gameState.position ? 'back' : 'forward';
  }

  // Should recover
  shouldRecover(gameState) {
    return gameState.position < -8 || gameState.position > 8;
  }

  // Find punish window
  findPunishWindow(gameState, patterns) {
    // High confidence if opponent just attacked
    if (gameState.opponentAttacking) {
      return {
        available: true,
        timing: 'immediate',
        confidence: 0.9
      };
    }

    // Check for whiff patterns
    if (patterns.weaknesses.some(w => w.type === 'whiff_punish')) {
      return {
        available: true,
        timing: 'delayed',
        confidence: 0.7
      };
    }

    return {
      available: false,
      timing: null,
      confidence: 0.3
    };
  }

  // Select combo based on aggression
  selectCombo(gameState, aggression) {
    const combos = [
      ['light', 'light', 'light'],           // Safe
      ['light', 'heavy'],                    // Medium
      ['heavy', 'special'],                  // High damage
      ['grab', 'light', 'heavy']             // Risk/reward
    ];

    if (aggression > 0.8) return combos[2];
    if (aggression > 0.5) return combos[1];
    return combos[0];
  }

  // Calculate optimal spacing
  calculateOptimalSpacing(gameState) {
    // Optimal range varies by evolution
    const optimalRange = 3 + EVOLUTION_LEVELS[this.evolutionLevel].adaptability * 2;
    return { ideal: optimalRange, tolerance: 1 };
  }

  // Should use projectiles
  shouldProject(gameState) {
    return gameState.opponentPosition > 5 && Math.random() > 0.4;
  }

  // Learn from action
  learn(action, gameState) {
    this.experience.push({
      ...action,
      timestamp: Date.now(),
      outcome: null // Will be updated later
    });

    // Evolve based on experience
    this.evolve();

    // Store in memory
    storeMemory(
      `AI Action: ${action.type} at evolution ${this.evolutionLevel}`,
      'ai_player'
    );
  }

  // Evolution logic
  evolve() {
    // Calculate experience metrics
    const recentExp = this.experience.slice(-20);
    const successRate = recentExp.filter(e => e.outcome === 'success').length / recentExp.length;

    // Evolution threshold
    const threshold = 0.6 + (this.evolutionLevel * 0.05);

    if (successRate >= threshold && this.evolutionLevel < 10) {
      this.evolutionLevel++;
      console.log(`🧬 AI EVOLVED TO LEVEL ${this.evolutionLevel}: ${EVOLUTION_LEVELS[this.evolutionLevel].name}`);
    }

    // Adapt behavior based on success
    if (successRate > 0.7) {
      this.adaptiveBehavior.aggressive += 0.05;
      this.adaptiveBehavior.patient -= 0.02;
    } else if (successRate < 0.3) {
      this.adaptiveBehavior.aggressive -= 0.05;
      this.adaptiveBehavior.patient += 0.02;
    }
  }

  // Record outcome
  recordOutcome(actionIndex, outcome) {
    if (this.experience[actionIndex]) {
      this.experience[actionIndex].outcome = outcome;
    }
    this.evolve();
  }

  // Get AI status
  getStatus() {
    const levelStats = EVOLUTION_LEVELS[this.evolutionLevel];

    return {
      id: this.id,
      evolutionLevel: this.evolutionLevel,
      evolutionName: levelStats.name,
      stats: {
        reactionTime: levelStats.reactionTime,
        aggression: levelStats.aggression,
        adaptability: levelStats.adaptability
      },
      behavior: this.adaptiveBehavior,
      experienceCount: this.experience.length
    };
  }
}

// Singleton AI player
let aiPlayer = null;

export function getAIPlayer(playerId = 'ai_player') {
  if (!aiPlayer || aiPlayer.id !== playerId) {
    aiPlayer = new AIBrain(playerId);
  }
  return aiPlayer;
}

export function resetAI() {
  aiPlayer = null;
}

export default {
  getAIPlayer,
  resetAI,
  AIBrain,
  EVOLUTION_LEVELS
};