/**
 * @file realtime-channels.command.ts
 * @module @stackra/realtime/commands
 * @description List active realtime channels with subscriber counts.
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'realtime:channels',
  description: 'List active realtime channels',
  options: [
    {
      name: '--type',
      short: '-t',
      description: 'Filter by channel type (public, private, presence)',
      type: 'string',
    },
  ],
})
export class RealtimeChannelsCommand extends BaseCommand {
  /**
   * Execute the realtime:channels command.
   *
   * @returns Exit code
   */
  public async handle(): Promise<number> {
    const type = this.option<string>('type');
    const out = this.output as any;

    const spinner = this.output.spinner();
    spinner.start('Fetching active channels...');
    // In production: await realtimeManager.listChannels(type);
    spinner.stop('Done', 0);

    out.table(
      ['Name', 'Subscribers', 'Type'],
      [
        // In production: rows from the realtime manager
      ]
    );

    this.output.info('Configure RealtimeModule to view live channel data.');
    return 0;
  }
}
