/**
 * @file bullmq.connector.ts
 * @module @stackra/queue/nestjs/connectors
 * @description BullMQ connector for production NestJS queue processing.
 *   Wraps BullMQ's Queue and Worker classes into the IQueueConnector interface.
 *   Requires `bullmq` and `ioredis` as peer dependencies.
 */
import { Logger } from '@nestjs/common';
import type {
  IQueueConnector,
  IQueueConnection,
  IJobOptions,
  IQueuedJob,
  QueueConnectionConfig,
} from '../../core/interfaces';

// ============================================================================
// BullMQ Connector
// ============================================================================

/**
 * BullMQ connector — production-grade job queue backed by Redis.
 *
 * Creates IQueueConnection instances backed by BullMQ Queue/Worker.
 * Supports delayed jobs, bulk dispatch, priority, retries, and backoff.
 *
 * @example
 * ```typescript
 * QueueModule.forRoot({ default: 'bullmq', connections: { bullmq: { driver: 'bullmq', redis: { host: 'localhost', port: 6379 } } } })
 * QueueModule.forFeature('bullmq', BullMQConnector)
 * ```
 */
export class BullMQConnector implements IQueueConnector {
  private readonly logger = new Logger(BullMQConnector.name);

  /**
   * Create a BullMQ-backed queue connection from the given config.
   *
   * Dynamically imports `bullmq` and `ioredis` to keep them as optional
   * peer dependencies. Creates a shared Redis connection for the queue.
   *
   * @param config - Connection configuration with `redis` and optional `queue` fields
   * @returns A BullMQ connection implementing IQueueConnection
   */
  public async connect(config: QueueConnectionConfig): Promise<IQueueConnection> {
    const { Queue, Worker } = await import('bullmq');
    const IORedis = (await import('ioredis')).default;

    const redisConfig = (config as any).redis ?? { host: 'localhost', port: 6379 };
    const connection = new IORedis(redisConfig);
    const queueName = (config as any).queue ?? 'default';
    const queue = new Queue(queueName, { connection });

    this.logger.log(`BullMQ connection established for queue "${queueName}"`);

    return new BullMQConnection(queue, connection, queueName);
  }
}

// ============================================================================
// BullMQ Connection
// ============================================================================

/**
 * BullMQ connection implementing IQueueConnection.
 *
 * Wraps a BullMQ Queue instance to provide the platform-agnostic queue
 * interface. Handles job dispatch, bulk operations, pause/resume, and cleanup.
 */
class BullMQConnection implements IQueueConnection {
  /**
   * @param queue - BullMQ Queue instance for job dispatch
   * @param redis - IORedis instance for the underlying connection
   * @param queueName - Name of the BullMQ queue
   */
  public constructor(
    private readonly queue: any,
    private readonly redis: any,
    private readonly queueName: string
  ) {}

  /**
   * Push a job onto the queue.
   *
   * @param name - Job name used for routing to processors
   * @param data - Job payload data
   * @param options - Optional job configuration (retries, backoff, priority)
   * @returns The assigned job ID
   */
  public async push<T>(name: string, data: T, options?: IJobOptions): Promise<string> {
    const job = await this.queue.add(name, data, this.mapOptions(options));
    return job.id ?? '';
  }

  /**
   * Push a job with a delay before it becomes eligible for processing.
   *
   * @param delayMs - Delay in milliseconds
   * @param name - Job name used for routing to processors
   * @param data - Job payload data
   * @param options - Optional job configuration
   * @returns The assigned job ID
   */
  public async later<T>(
    delayMs: number,
    name: string,
    data: T,
    options?: IJobOptions
  ): Promise<string> {
    const job = await this.queue.add(name, data, { ...this.mapOptions(options), delay: delayMs });
    return job.id ?? '';
  }

  /**
   * Push multiple jobs at once in a single Redis round-trip.
   *
   * @param jobs - Array of job definitions with name, data, and optional options
   * @returns Array of assigned job IDs in the same order
   */
  public async bulk<T>(
    jobs: Array<{ name: string; data: T; options?: IJobOptions }>
  ): Promise<string[]> {
    const bullJobs = jobs.map((j) => ({
      name: j.name,
      data: j.data,
      opts: this.mapOptions(j.options),
    }));
    const results = await this.queue.addBulk(bullJobs);
    return results.map((r: any) => r.id ?? '');
  }

  /**
   * Pop the next available job from the queue.
   *
   * BullMQ uses a worker-based pull model rather than direct pop semantics.
   * For compatibility, this always returns null — workers handle consumption.
   *
   * @param _queue - Unused (BullMQ workers handle consumption)
   * @returns Always null (use BullMQ Worker for job consumption)
   */
  public async pop(_queue?: string): Promise<IQueuedJob | null> {
    return null;
  }

  /**
   * Get the total number of jobs across all states (waiting + active + delayed).
   *
   * @param _queue - Unused (scoped to the queue this connection owns)
   * @returns Total job count
   */
  public async size(_queue?: string): Promise<number> {
    const counts = await this.queue.getJobCounts();
    return (counts.waiting ?? 0) + (counts.active ?? 0) + (counts.delayed ?? 0);
  }

  /**
   * Remove a specific job by its ID.
   *
   * @param jobId - The job ID to remove
   */
  public async remove(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) await job.remove();
  }

  /**
   * Pause the queue — stops workers from picking up new jobs.
   *
   * @param _queue - Unused (scoped to the queue this connection owns)
   */
  public async pause(_queue?: string): Promise<void> {
    await this.queue.pause();
  }

  /**
   * Resume a paused queue — workers start picking up jobs again.
   *
   * @param _queue - Unused (scoped to the queue this connection owns)
   */
  public async resume(_queue?: string): Promise<void> {
    await this.queue.resume();
  }

  /**
   * Clear all jobs from the queue using BullMQ's obliterate command.
   *
   * This is a destructive operation — all waiting, active, and delayed
   * jobs are permanently removed.
   *
   * @param _queue - Unused (scoped to the queue this connection owns)
   */
  public async clear(_queue?: string): Promise<void> {
    await this.queue.obliterate({ force: true });
  }

  /**
   * Close the queue and release all Redis connections.
   */
  public async close(): Promise<void> {
    await this.queue.close();
    await this.redis.quit();
  }

  /**
   * Map platform-agnostic IJobOptions to BullMQ-specific job options.
   *
   * @param options - Platform-agnostic job options
   * @returns BullMQ-compatible options object
   */
  private mapOptions(options?: IJobOptions): Record<string, unknown> {
    if (!options) return {};

    const mapped: Record<string, unknown> = {};

    if (options.tries !== undefined) {
      mapped.attempts = options.tries;
    }

    if (options.backoffMs !== undefined) {
      mapped.backoff = { type: 'exponential', delay: options.backoffMs };
    }

    if (options.delayMs !== undefined) {
      mapped.delay = options.delayMs;
    }

    if (options.uniqueId !== undefined) {
      mapped.jobId = options.uniqueId;
    }

    if (options.driverOptions) {
      Object.assign(mapped, options.driverOptions);
    }

    return mapped;
  }
}
