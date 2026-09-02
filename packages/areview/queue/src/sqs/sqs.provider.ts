import type { QueueMessage, QueueProvider, QueuePublishOptions, QueuePublishResult, QueueProviderCapabilities } from '../contracts/queue.types.js';
export interface SqsSendMessageCommand { QueueUrl: string; MessageBody: string; DelaySeconds?: number; MessageDeduplicationId?: string; MessageGroupId?: string; }
export interface SqsClientLike { send(command: { input: SqsSendMessageCommand }): Promise<{ MessageId?: string }> }
export class SqsQueueProvider implements QueueProvider {
  readonly kind='sqs' as const;
  readonly capabilities: QueueProviderCapabilities={delayedDelivery:true,deduplication:true,fifo:true,batching:true,deadLetter:true,consumer:true};
  constructor(private readonly client:SqsClientLike, private readonly queueUrl:(queue:string)=>string) {}
  async publish<TBody>(_queue:string, message:QueueMessage<TBody>, options:QueuePublishOptions={}):Promise<QueuePublishResult>{ const result=await this.client.send({input:{QueueUrl:this.queueUrl(_queue),MessageBody:JSON.stringify(message),DelaySeconds:options.delayMs?Math.min(900,Math.floor(options.delayMs/1000)):undefined,MessageDeduplicationId:options.deduplicationId,MessageGroupId:options.groupId}}); return {id:result.MessageId??message.id,provider:this.kind}; }
}
