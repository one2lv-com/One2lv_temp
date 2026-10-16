const { council, send } = require('../modules/council');

describe('Council Module', () => {
  let messageHandler;

  beforeEach(() => {
    // Remove all existing listeners
    council.removeAllListeners();
    messageHandler = jest.fn();
    council.on('msg', messageHandler);
  });

  afterEach(() => {
    council.removeAllListeners();
  });

  describe('send()', () => {
    test('should emit message event with correct structure', () => {
      const agent = 'TestAgent';
      const message = 'Test message';
      const meta = { priority: 'high' };

      send(agent, message, meta);

      expect(messageHandler).toHaveBeenCalledTimes(1);
      const packet = messageHandler.mock.calls[0][0];

      expect(packet).toHaveProperty('time');
      expect(packet.agent).toBe(agent);
      expect(packet.msg).toBe(message);
      expect(packet.meta).toEqual(meta);
      expect(typeof packet.time).toBe('number');
    });

    test('should use empty meta object when meta not provided', () => {
      send('Agent', 'Message');

      expect(messageHandler).toHaveBeenCalledTimes(1);
      const packet = messageHandler.mock.calls[0][0];

      expect(packet.meta).toEqual({});
    });

    test('should include timestamp in milliseconds', () => {
      const beforeTime = Date.now();
      send('Agent', 'Message');
      const afterTime = Date.now();

      const packet = messageHandler.mock.calls[0][0];

      expect(packet.time).toBeGreaterThanOrEqual(beforeTime);
      expect(packet.time).toBeLessThanOrEqual(afterTime);
    });

    test('should handle multiple messages in sequence', () => {
      send('Agent1', 'Message1');
      send('Agent2', 'Message2');
      send('Agent3', 'Message3');

      expect(messageHandler).toHaveBeenCalledTimes(3);

      const [packet1, packet2, packet3] = messageHandler.mock.calls.map(call => call[0]);

      expect(packet1.agent).toBe('Agent1');
      expect(packet2.agent).toBe('Agent2');
      expect(packet3.agent).toBe('Agent3');

      expect(packet2.time).toBeGreaterThanOrEqual(packet1.time);
      expect(packet3.time).toBeGreaterThanOrEqual(packet2.time);
    });
  });

  describe('Council EventEmitter', () => {
    test('should support multiple listeners', () => {
      const handler2 = jest.fn();
      council.on('msg', handler2);

      send('Agent', 'Message');

      expect(messageHandler).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    test('should support listener removal', () => {
      council.off('msg', messageHandler);

      send('Agent', 'Message');

      expect(messageHandler).not.toHaveBeenCalled();
    });

    test('should handle custom events', (done) => {
      council.once('custom', (data) => {
        expect(data).toBe('test');
        done();
      });

      council.emit('custom', 'test');
    });
  });
});
