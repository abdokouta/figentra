/**
 * @file processor.decorator.ts
 * @module @stackra/queue/core/decorators
 * @description Class decorator marking a class as a queue job processor.
 *   Discovered at bootstrap and registered to handle jobs from a specific queue.
 */

import { defineMetadata } from '@vivtel/metadata';
import { PROCESSOR_METADATA } from '../constants';

/**
 * Mark a class as a queue job processor.
 *
 * The class must implement a `process(job)` method. At bootstrap,
 * discovered processors are bound to their queue's worker.
 *
 * @param queueOrOptions - Queue name string or full options
 * @returns A class decorator
 *
 * @example
 * ```typescript
 * @Processor('emails')
 * @Injectable()
 * class EmailProcessor {
 *   async process(job: IQueuedJob<EmailPayload>): Promise<void> {
 *     await this.mailer.send(job.data.to, job.data.subject, job.data.body);
 *   }
 * }
 * ```
 */
export function Processor(queueOrOptions: string | ProcessorOptions): ClassDecorator {
  const options: ProcessorOptions =
    typeof queueOrOptions === 'string' ? { queue: queueOrOptions } : queueOrOptions;

  return (target: Function) => {
    defineMetadata(PROCESSOR_METADATA, options, target);
  };
}
