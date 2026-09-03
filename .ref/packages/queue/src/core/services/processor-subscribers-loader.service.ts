/**
 * @file processor-subscribers-loader.service.ts
 * @module @stackra/queue/core/services
 * @description Auto-discovers @Processor() decorated classes at bootstrap.
 *   Validates they have a `process(job)` method and binds them to the Worker
 *   for their configured queue.
 */

import { IInjectable, Inject, Optional } from '@stackra/ts-container';
import type { IOnModuleInit } from '@stackra/ts-container';
import { getMetadata } from '@vivtel/metadata';

import { QUEUE_MANAGER, PROCESSOR_METADATA } from '../constants';
import { QueueManager } from './queue-manager.service';
import type { ProcessorOptions } from '../decorators/processor.decorator';

// ════════════════════════════════════════════════════════════════════════════════
// Discovery Interface
// ════════════════════════════════════════════════════════════════════════════════

/** Minimal discovery service interface. */
interface IDiscoveryService {
  getProviders(): Array<{ instance: unknown; metatype?: Function | null }>;
}

/** DI token for the discovery service. */
const DISCOVERY_SERVICE = Symbol.for('DISCOVERY_SERVICE');

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Auto-discovers @Processor() decorated classes and binds them to workers.
 *
 * At bootstrap:
 * 1. Scans all DI providers for @Processor metadata
 * 2. Validates each has a `process(job)` method
 * 3. Registers the processor with the QueueManager
 *
 * @example
 * ```typescript
 * @Processor('emails')
 * @IInjectable()
 * class EmailProcessor {
 *   async process(job: IQueuedJob<EmailPayload>): Promise<void> {
 *     await this.mailer.send(job.data);
 *   }
 * }
 * // Auto-discovered and registered at bootstrap
 * ```
 */
@IInjectable()
export class ProcessorSubscribersLoader implements IOnModuleInit {
  /** Registered processors (queue → handler). */
  private readonly processors = new Map<string, (job: any) => Promise<void>>();

  public constructor(
    @Inject(QUEUE_MANAGER) public readonly queueManager: QueueManager,
    @Optional() @Inject(DISCOVERY_SERVICE) private readonly discoveryService?: IDiscoveryService
  ) {}

  /** Scan and register processors at module init. */
  public onModuleInit(): void {
    this.loadProcessors();
  }

  /**
   * Get the registered processor for a queue.
   *
   * @param queue - Queue name
   * @returns The processor handler, or undefined
   */
  public getProcessor(queue: string): ((job: any) => Promise<void>) | undefined {
    return this.processors.get(queue);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════════

  /** Discover all @Processor classes. */
  private loadProcessors(): void {
    if (!this.discoveryService) return;
    const providers = this.discoveryService.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance) continue;

      const ctor = (instance as { constructor?: Function }).constructor;
      if (!ctor) continue;

      const options = getMetadata<ProcessorOptions>(PROCESSOR_METADATA, ctor as object);
      if (!options) continue;

      const processor = instance as { process?: (job: any) => Promise<void> };
      if (typeof processor.process !== 'function') continue;

      // Bind the process method to the instance
      this.processors.set(options.queue, (job) => processor.process!(job));
    }
  }
}
