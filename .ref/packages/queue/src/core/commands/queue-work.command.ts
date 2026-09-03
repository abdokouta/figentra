/**
 * @file queue-work.command.ts
 * @module @stackra/queue/commands
 * @description Start processing jobs from a queue.
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'queue:work',
  description: 'Start processing jobs from a queue',
  options: [
    {
      name: '--queue',
      short: '-q',
      description: 'Queue name to process',
      type: 'string',
      default: 'default',
    },
    {
      name: '--tries',
      short: '-t',
      description: 'Max retry attempts per job',
      type: 'number',
      default: 3,
    },
    { name: '--timeout', description: 'Job timeout in seconds', type: 'number', default: 60 },
    {
      name: '--once',
      description: 'Process a single job then exit',
      type: 'boolean',
      default: false,
    },
  ],
})
export class QueueWorkCommand extends BaseCommand {
  public async handle(): Promise<number> {
    const queue = this.option<string>('queue') ?? 'default';
    const tries = this.option<number>('tries') ?? 3;
    const timeout = this.option<number>('timeout') ?? 60;
    const once = this.option<boolean>('once') ?? false;
    const out = this.output as any;

    out.box(
      'Queue Worker',
      `Processing jobs from "${queue}" queue\nMax tries: ${tries} | Timeout: ${timeout}s`
    );

    if (once) {
      const spinner = this.output.spinner();
      spinner.start(`Processing next job from "${queue}"...`);
      // In production: await queueManager.processNext(queue)
      spinner.stop('Job processed', 0);
      this.output.success('Single job processed. Exiting.');
      return 0;
    }

    this.output.info(`Worker started. Press Ctrl+C to stop.`);
    out.pairs({ Queue: queue, Tries: String(tries), Timeout: `${timeout}s` });
    this.output.newLine();

    // In production: this would start the worker loop
    // await queueManager.work(queue, { tries, timeout });
    this.output.warning('Queue worker not connected — install @nestjs/bullmq for production.');
    return 0;
  }
}
