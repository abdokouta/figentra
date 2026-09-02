import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import type { QueueProvider } from '../contracts/queue.types';
import { QUEUE_PROVIDER } from '../tokens';
import { BullMqQueueProvider } from '../bullmq/bullmq.provider';

export interface NestQueueOptions { connection: Parameters<typeof BullModule.forRoot>[0]['connection']; prefix?: string; }

/** NestJS composition module; the queue abstraction remains framework-neutral. */
@Module({})
export class NestQueueModule {
  static forRoot(options: NestQueueOptions): DynamicModule {
    return { module: NestQueueModule, imports: [BullModule.forRoot({ connection: options.connection, prefix: options.prefix })], exports: [BullModule] };
  }
  static forProvider(provider: QueueProvider): DynamicModule {
    return { module: NestQueueModule, providers: [{ provide: QUEUE_PROVIDER, useValue: provider }], exports: [QUEUE_PROVIDER] };
  }
}

export { BullMqQueueProvider } from '../bullmq/bullmq.provider';
