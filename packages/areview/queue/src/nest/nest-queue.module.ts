import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import type { QueueProvider, QueuePublishOptions, QueuePublishResult, QueueProviderCapabilities, QueueMessage } from '../contracts/queue.types.js';
import { QUEUE_PROVIDER } from '../tokens.js';

export interface NestQueueOptions { connection: Parameters<typeof BullModule.forRoot>[0]['connection']; prefix?: string; }
export interface BullQueueLike { add(name:string,data:unknown,options?:Record<string,unknown>):Promise<{id?:string|number}>; }
export class BullMqQueueProvider implements QueueProvider {
  readonly kind='bullmq' as const; readonly capabilities:QueueProviderCapabilities={delayedDelivery:true,batching:true,deadLetter:true,consumer:true};
  constructor(private readonly resolve:(queue:string)=>BullQueueLike) {}
  async publish<TBody>(queue:string,message:QueueMessage<TBody>,options:QueuePublishOptions={}):Promise<QueuePublishResult>{ const job=await this.resolve(queue).add(message.type,message,{delay:options.delayMs}); return {id:String(job.id??message.id),provider:this.kind}; }
}

@Module({})
export class NestQueueModule {
  static forRoot(options:NestQueueOptions):DynamicModule { return {module:NestQueueModule,imports:[BullModule.forRoot({connection:options.connection,prefix:options.prefix})],exports:[BullModule]}; }
  static forProvider(provider:QueueProvider):DynamicModule { return {module:NestQueueModule,providers:[{provide:QUEUE_PROVIDER,useValue:provider}],exports:[QUEUE_PROVIDER]}; }
}
