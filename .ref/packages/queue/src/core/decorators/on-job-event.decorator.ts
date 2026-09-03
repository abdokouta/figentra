/**
 * @file on-job-event.decorator.ts
 * @module @stackra/queue/core/decorators
 * @description Method decorator to subscribe to worker lifecycle events.
 */

import { defineMetadata } from '@vivtel/metadata';
import { ON_JOB_EVENT_METADATA } from '../constants';

/**
 * Subscribe a method to queue worker lifecycle events.
 *
 * @param event - The job event type to listen for
 * @param queue - Optional queue name filter
 * @returns A method decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class QueueMonitor {
 *   @OnJobEvent('failed')
 *   onJobFailed(payload: { jobId: string; error: string }): void {
 *     this.alertService.notify(payload);
 *   }
 * }
 * ```
 */
export function OnJobEvent(event: JobEventType, queue?: string): MethodDecorator {
  return (_target, _key, descriptor: TypedPropertyDescriptor<any>) => {
    defineMetadata(ON_JOB_EVENT_METADATA, { event, queue }, descriptor.value as object);
    return descriptor;
  };
}
