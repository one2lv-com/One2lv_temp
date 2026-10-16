const { ingestTelemetry, comboState } = require('../modules/telemetry_combo_detector');
const { council } = require('../modules/council');

// Mock the council module
jest.mock('../modules/council', () => ({
  council: {
    emit: jest.fn()
  },
  send: jest.fn()
}));

describe('Telemetry Combo Detector', () => {
  beforeEach(() => {
    // Reset combo state before each test
    comboState.active = false;
    comboState.hitCount = 0;
    comboState.lastEventTs = 0;
    comboState.lastDamage = 0;
    jest.clearAllMocks();
  });

  describe('ingestTelemetry()', () => {
    test('should increment hit count on hit event', () => {
      const packet = { type: 'hit', damage: 25 };
      const result = ingestTelemetry(packet);

      expect(result.hitCount).toBe(1);
      expect(result.lastEventTs).toBeGreaterThan(0);
    });

    test('should reset combo after timeout (>2200ms)', () => {
      // Simulate old hit
      comboState.hitCount = 5;
      comboState.lastEventTs = Date.now() - 3000; // 3 seconds ago

      const packet = { type: 'hit', damage: 25 };
      const result = ingestTelemetry(packet);

      expect(result.hitCount).toBe(1); // Reset to 1 (new hit)
    });

    test('should maintain combo within timeout window', () => {
      // First hit
      ingestTelemetry({ type: 'hit', damage: 25 });

      // Second hit within window (simulate 500ms later)
      comboState.lastEventTs = Date.now() - 500;
      const result = ingestTelemetry({ type: 'hit', damage: 30 });

      expect(result.hitCount).toBe(2);
    });

    test('should trigger council message when combo >= 3', () => {
      const { send } = require('../modules/council');

      // Build up combo
      ingestTelemetry({ type: 'hit' });
      comboState.lastEventTs = Date.now();
      ingestTelemetry({ type: 'hit' });
      comboState.lastEventTs = Date.now();
      ingestTelemetry({ type: 'hit' });

      expect(send).toHaveBeenCalledWith(
        'Lumenis',
        expect.stringContaining('Combo: 3 hits'),
        expect.objectContaining({ highlight: true })
      );
    });

    test('should only count hit events', () => {
      ingestTelemetry({ type: 'dodge' });
      ingestTelemetry({ type: 'jump' });
      ingestTelemetry({ type: 'special' });

      expect(comboState.hitCount).toBe(0);
    });

    test('should update lastEventTs on every event', () => {
      const before = Date.now();
      ingestTelemetry({ type: 'hit' });
      const after = Date.now();

      expect(comboState.lastEventTs).toBeGreaterThanOrEqual(before);
      expect(comboState.lastEventTs).toBeLessThanOrEqual(after);
    });

    test('should handle rapid succession of hits', () => {
      const timestamps = [];

      for (let i = 0; i < 10; i++) {
        comboState.lastEventTs = Date.now();
        const result = ingestTelemetry({ type: 'hit', damage: 10 });
        timestamps.push(result.lastEventTs);
      }

      expect(comboState.hitCount).toBe(10);

      // Verify timestamps are increasing
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    test('should return current combo state', () => {
      comboState.hitCount = 5;
      comboState.lastEventTs = 123456789;
      comboState.lastDamage = 50;

      const result = ingestTelemetry({ type: 'dodge' });

      expect(result).toMatchObject({
        hitCount: 5,
        lastEventTs: expect.any(Number),
        lastDamage: 50
      });
    });
  });

  describe('Combo State', () => {
    test('should have correct initial state', () => {
      expect(comboState).toHaveProperty('active');
      expect(comboState).toHaveProperty('hitCount');
      expect(comboState).toHaveProperty('lastEventTs');
      expect(comboState).toHaveProperty('lastDamage');

      expect(comboState.active).toBe(false);
      expect(comboState.hitCount).toBe(0);
      expect(comboState.lastEventTs).toBe(0);
      expect(comboState.lastDamage).toBe(0);
    });

    test('should be mutable', () => {
      comboState.hitCount = 10;
      expect(comboState.hitCount).toBe(10);

      comboState.hitCount = 0;
      expect(comboState.hitCount).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing packet type', () => {
      const result = ingestTelemetry({});
      expect(result.hitCount).toBe(0);
    });

    test('should handle null packet', () => {
      const result = ingestTelemetry(null);
      expect(result.hitCount).toBe(0);
    });

    test('should handle exactly 2200ms timeout boundary', () => {
      comboState.hitCount = 3;
      comboState.lastEventTs = Date.now() - 2200;

      const result = ingestTelemetry({ type: 'hit' });

      // Should reset at boundary
      expect(result.hitCount).toBe(1);
    });

    test('should handle just under timeout boundary', () => {
      comboState.hitCount = 3;
      comboState.lastEventTs = Date.now() - 2199;

      const result = ingestTelemetry({ type: 'hit' });

      // Should maintain combo
      expect(result.hitCount).toBe(4);
    });
  });
});
