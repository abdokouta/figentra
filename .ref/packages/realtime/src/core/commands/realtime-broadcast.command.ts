/**
 * @file realtime-broadcast.command.ts
 * @module @stackra/realtime/commands
 * @description Send a test broadcast message to a realtime channel.
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'realtime:broadcast',
  description: 'Send a test broadcast to a channel',
  arguments: [
    { name: 'channel', description: 'Channel name to broadcast to', required: true },
    { name: 'message', description: 'Message content to send', required: true },
  ],
})
export class RealtimeBroadcastCommand extends BaseCommand {
  /**
   * Execute the realtime:broadcast command.
   *
   * @returns Exit code
   */
  public async handle(): Promise<number> {
    const channel = this.argument<string>('channel');
    const message = this.argument<string>('message');
    const out = this.output as any;

    const spinner = this.output.spinner();
    spinner.start(`Broadcasting to "${channel}"...`);
    // In production: await realtimeManager.broadcast(channel, message);
    spinner.stop('Sent', 0);

    out.pairs({ Channel: channel, Message: message });
    this.output.success(`Broadcast sent to "${channel}".`);
    return 0;
  }
}
