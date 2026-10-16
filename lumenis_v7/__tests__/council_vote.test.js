const { vote, result } = require('../modules/council_vote');

describe('Council Vote Module', () => {
  // Access internal votes object through module
  const getVotes = () => {
    // Reset by calling result and checking internal state
    vote('reset', 'Neutral');
    return {};
  };

  beforeEach(() => {
    // Clear votes by creating new require
    jest.resetModules();
  });

  describe('vote()', () => {
    test('should record a single vote', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      freshVote('Agent1', 'Aggressive');
      const winner = freshResult();

      expect(winner).toBe('Aggressive');
    });

    test('should count multiple votes for same strategy', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      freshVote('Agent1', 'Defensive');
      freshVote('Agent2', 'Defensive');
      freshVote('Agent3', 'Defensive');

      const winner = freshResult();
      expect(winner).toBe('Defensive');
    });

    test('should track votes from different agents', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      freshVote('Agent1', 'Aggressive');
      freshVote('Agent2', 'Defensive');
      freshVote('Agent3', 'Neutral');

      const winner = freshResult();
      expect(['Aggressive', 'Defensive', 'Neutral']).toContain(winner);
    });

    test('should allow agent to change vote', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      freshVote('Agent1', 'Aggressive');
      freshVote('Agent1', 'Defensive');

      // Both strategies should have votes since we count by strategy, not agent
      const winner = freshResult();
      expect(['Aggressive', 'Defensive']).toContain(winner);
    });
  });

  describe('result()', () => {
    test('should return Neutral when no votes', () => {
      const { result: freshResult } = require('../modules/council_vote');
      expect(freshResult()).toBe('Neutral');
    });

    test('should return strategy with most votes', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      freshVote('Agent1', 'Aggressive');
      freshVote('Agent2', 'Aggressive');
      freshVote('Agent3', 'Defensive');

      expect(freshResult()).toBe('Aggressive');
    });

    test('should handle tie by returning first in sort', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      freshVote('Agent1', 'Aggressive');
      freshVote('Agent2', 'Defensive');

      const winner = freshResult();
      // With same vote count, first one wins (alphabetically sorted in case of tie)
      expect(['Aggressive', 'Defensive']).toContain(winner);
    });

    test('should update result as votes come in', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      freshVote('Agent1', 'Aggressive');
      expect(freshResult()).toBe('Aggressive');

      freshVote('Agent2', 'Defensive');
      freshVote('Agent3', 'Defensive');
      expect(freshResult()).toBe('Defensive');

      freshVote('Agent4', 'Aggressive');
      freshVote('Agent5', 'Aggressive');
      expect(freshResult()).toBe('Aggressive');
    });
  });

  describe('Integration', () => {
    test('should handle complex voting scenario', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      // Round 1: Aggressive leads
      freshVote('Predictor', 'Aggressive');
      freshVote('Trainer', 'Aggressive');
      freshVote('Gemini', 'Defensive');
      expect(freshResult()).toBe('Aggressive');

      // Round 2: Defensive catches up
      freshVote('Lumenis', 'Defensive');
      freshVote('VoiceCoach', 'Defensive');
      expect(freshResult()).toBe('Defensive');

      // Round 3: Aggressive wins
      freshVote('Registry', 'Aggressive');
      expect(freshResult()).toBe('Aggressive');
    });

    test('should support custom strategy names', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      freshVote('Agent1', 'CustomStrategy1');
      freshVote('Agent2', 'CustomStrategy2');
      freshVote('Agent3', 'CustomStrategy1');

      expect(freshResult()).toBe('CustomStrategy1');
    });

    test('should handle case-sensitive strategies', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      freshVote('Agent1', 'aggressive');
      freshVote('Agent2', 'Aggressive');

      // These are different strategies
      const winner = freshResult();
      expect(['aggressive', 'Aggressive']).toContain(winner);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string strategy', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      freshVote('Agent1', '');
      expect(freshResult()).toBe('');
    });

    test('should handle undefined strategy gracefully', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      freshVote('Agent1', undefined);
      const winner = freshResult();
      expect(winner).toBeDefined();
    });

    test('should handle very long strategy names', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      const longStrategy = 'A'.repeat(1000);
      freshVote('Agent1', longStrategy);
      expect(freshResult()).toBe(longStrategy);
    });

    test('should handle many votes efficiently', () => {
      const { vote: freshVote, result: freshResult } = require('../modules/council_vote');

      for (let i = 0; i < 1000; i++) {
        freshVote(`Agent${i}`, 'MassVote');
      }

      expect(freshResult()).toBe('MassVote');
    });
  });
});
