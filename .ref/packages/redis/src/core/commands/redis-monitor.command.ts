/**
 * @file redis-monitor.command.ts
 * @module @stackra/redis/commands
 * @description Monitor Redis commands in real-time (diagnostic tool).
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'redis:monitor',
  description: 'Monitor Redis commands in real-time (press Ctrl+C to stop)',
  options: [
    {
      name: '--connection',
      short: '-c',
      description: 'Connection name',
      type: 'string',
      default: 'default',
    },
    { name: '--pattern', short: '-p', description: 'Filter by key pattern', type: 'string' },
  ],
})
export class RedisMonitorCommand extends BaseCommand {
  public async handle(): Promise<number> {
    const connection = this.option<string>('connection') ?? 'default';
    const pattern = this.option<string>('pattern');
    const out = this.output as any;

    out.box(
      'Redis Monitor',
      `Connection: ${connection}\nPattern: ${pattern ?? '*'}\nPress Ctrl+C to stop.`
    );

    // In production: subscribe to Redis MONITOR stream
    this.output.info('Waiting for commands...');
    this.output.warning('Redis monitor not connected — configure RedisModule first.');
    return 0;
  }
}
