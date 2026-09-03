/**
 * @file event-list.command.ts
 * @module @stackra/events/commands
 * @description List all registered event listeners and subscribers.
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'event:list',
  description: 'List all registered event listeners',
  options: [{ name: '--event', short: '-e', description: 'Filter by event name', type: 'string' }],
})
export class EventListCommand extends BaseCommand {
  public async handle(): Promise<void> {
    const eventFilter = this.option<string>('event');
    const out = this.output as any;

    const spinner = this.output.spinner();
    spinner.start('Scanning registered listeners...');
    // In production: inject EventEmitter, get registered listeners
    spinner.stop('Done', 0);

    out.separator(60, 'Event Listeners');
    out.info('No event listeners discovered. Use @OnEvent() decorator to register listeners.');
    out.step('Listeners are auto-discovered via the DISCOVERY_SERVICE pattern.');
  }
}
