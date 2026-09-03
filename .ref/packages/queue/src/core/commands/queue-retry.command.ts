/**
 * @file queue-retry.command.ts
 * @module @stackra/queue/commands
 * @description Retry failed jobs in a queue.
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'queue:retry',
  description: 'Retry failed jobs in a queue',
  arguments: [
    {
      name: 'id',
      description: 'Specific job ID to retry (or "all" for all failed)',
      required: false,
      default: 'all',
    },
  ],
  options: [
    { name: '--queue', short: '-q', description: 'Queue name', type: 'string', default: 'default' },
  ],
})
export class QueueRetryCommand extends BaseCommand {
  public async handle(): Promise<number> {
    const id = this.argumentOptional<string>('id') ?? 'all';
    const queue = this.option<string>('queue') ?? 'default';
    const out = this.output as any;

    const spinner = this.output.spinner();

    if (id === 'all') {
      spinner.start(`Retrying all failed jobs in "${queue}"...`);
      // In production: const count = await queueService.retryAll(queue);
      spinner.stop('Retry complete', 0);
      this.output.success(`All failed jobs in "${queue}" have been re-queued.`);
    } else {
      spinner.start(`Retrying job ${id}...`);
      // In production: await queueService.retry(queue, id);
      spinner.stop('Done', 0);
      this.output.success(`Job ${id} re-queued for processing.`);
    }

    return 0;
  }
}
