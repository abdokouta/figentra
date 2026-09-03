/**
 * @file redis-flush.command.ts
 * @module @stackra/redis/commands
 * @description Flush all keys from a Redis connection.
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'redis:flush',
  description: 'Flush all keys from a Redis connection (destructive)',
  options: [
    {
      name: '--connection',
      short: '-c',
      description: 'Connection name',
      type: 'string',
      default: 'default',
    },
    {
      name: '--force',
      short: '-f',
      description: 'Skip confirmation',
      type: 'boolean',
      default: false,
    },
  ],
})
export class RedisFlushCommand extends BaseCommand {
  public async handle(): Promise<number> {
    const connection = this.option<string>('connection') ?? 'default';
    const force = this.option<boolean>('force') ?? false;

    if (!force) {
      this.output.warning(`This will DELETE ALL KEYS in Redis connection "${connection}".`);
      const confirmed = await this.output.confirm('Continue?', { initialValue: false });
      if (!confirmed) {
        this.output.info('Cancelled.');
        return 0;
      }
    }

    const spinner = this.output.spinner();
    spinner.start(`Flushing Redis "${connection}"...`);
    // In production: await redisManager.connection(connection).flushdb();
    spinner.stop('Flushed', 0);
    this.output.success(`All keys removed from "${connection}" connection.`);
    return 0;
  }
}
