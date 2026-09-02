import { describe, expect, it } from 'vitest';
import { QueueManager, type QueueProvider } from '../../src/index';

describe('QueueManager', () => {
  it('routes publish to the selected provider', async () => {
    const calls: string[] = [];
    const provider: QueueProvider = {
      kind: 'custom',
      capabilities: { delayedDelivery: false, deduplication: false, fifo: false, batching: false, deadLetter: false, consumer: false, visibilityTimeout: false },
      async publish(_queue, message) { calls.push(message.type); return { id: message.id, provider: 'custom' }; },
    };
    const manager = new QueueManager({ providers: { custom: provider }, defaultProvider: 'custom' });
    const result = await manager.publish('orders', 'order.created', { id: 1 });
    expect(result.provider).toBe('custom');
    expect(calls).toEqual(['order.created']);
  });
  it('rejects unsupported pull consumption', async () => {
    const provider: QueueProvider = { kind: 'custom', capabilities: { delayedDelivery: false, deduplication: false, fifo: false, batching: false, deadLetter: false, consumer: false, visibilityTimeout: false }, async publish(_q, m) { return { id: m.id, provider: 'custom' }; } };
    const manager = new QueueManager({ providers: { custom: provider }, defaultProvider: 'custom' });
    await expect(manager.consume('orders', async () => undefined)).rejects.toThrow('does not expose a pull consumer');
  });
});
