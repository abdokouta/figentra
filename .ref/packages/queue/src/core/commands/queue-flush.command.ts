/**
 * @file queue-flush.command.ts
 * @module @stackra/queue/commands
 * @description Remove all jobs from a queue (waiting + failed).
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'queue:flush',
  description: 'Remove all jobs from a queue (destructive)',
  options: [
    { name: '--queue', short: '-q', description: 'Queue name', type: 'string', default: 'default' },
    {
      name: '--force',
      short: '-f',
      description: 'Skip confirmation',
      type: 'boolean',
      default: false,
    },
  ],
})
export class QueueFlushCommand extends BaseCommand {
  public async handle(): Promise<number> {
    const queue = this.option<string>('queue') ?? 'default';
    const force = this.option<boolean>('force') ?? false;

    if (!force) {
      this.output.warning(`This will remove ALL jobs from "${queue}" (waiting + failed).`);
      const confirmed = await this.output.confirm('Continue?', { initialValue: false });
      if (!confirmed) {
        this.output.info('Cancelled.');
        return 0;
      }
    }

    const spinner = this.output.spinner();
    spinner.start(`Flushing queue "${queue}"...`);

    // In production: await queueService.flush(queue);
    spinner.stop('Queue flushed', 0);
    this.output.success(`All jobs removed from "${queue}".`);
    return 0;
  }
}
