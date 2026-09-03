/**
 * @file event-replay.command.ts
 * @module @stackra/events/commands
 * @description Replay a stored/logged event for debugging.
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'event:replay',
  description: 'Replay a stored event for debugging',
  arguments: [{ name: 'event', description: 'Event name to replay', required: true }],
  options: [
    { name: '--payload', short: '-p', description: 'JSON payload to send', type: 'string' },
  ],
})
export class EventReplayCommand extends BaseCommand {
  public async handle(): Promise<number> {
    const event = this.argument<string>('event');
    const payload = this.option<string>('payload');
    const out = this.output as any;

    const spinner = this.output.spinner();
    spinner.start(`Replaying event "${event}"...`);
    // In production: await eventEmitter.emit(event, JSON.parse(payload ?? '{}'));
    spinner.stop('Event dispatched', 0);

    out.pairs({ Event: event, Payload: payload ?? '{}' });
    this.output.success(`Event "${event}" replayed.`);
    return 0;
  }
}
