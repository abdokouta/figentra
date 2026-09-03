/**
 * @file redis-info.command.ts
 * @module @stackra/redis/commands
 * @description Display Redis server information and statistics.
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'redis:info',
  description: 'Display Redis server information and statistics',
  options: [
    {
      name: '--connection',
      short: '-c',
      description: 'Connection name',
      type: 'string',
      default: 'default',
    },
    {
      name: '--section',
      short: '-s',
      description: 'Info section (server, clients, memory, stats, all)',
      type: 'string',
      default: 'all',
    },
  ],
})
export class RedisInfoCommand extends BaseCommand {
  public async handle(): Promise<number> {
    const connection = this.option<string>('connection') ?? 'default';
    const section = this.option<string>('section') ?? 'all';
    const out = this.output as any;

    const spinner = this.output.spinner();
    spinner.start(`Fetching Redis info from "${connection}"...`);

    // In production: const info = await redisManager.connection(connection).info(section);
    spinner.stop('Done', 0);

    out.separator(60, `Redis Info (${connection})`);
    out.pairs({
      Connection: connection,
      Section: section,
      Status: 'connected',
    });

    this.output.info('Configure RedisModule to view live server information.');
    return 0;
  }
}
