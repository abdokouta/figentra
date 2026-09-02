import type { QueueConsumeOptions, QueueHandler, QueueMessage, QueueProvider, QueueProviderCapabilities, QueuePublishOptions, QueuePublishResult, QueueSubscription } from '../contracts/queue.types.js';

export interface SqsSendMessageCommand { QueueUrl: string; MessageBody: string; DelaySeconds?: number; MessageDeduplicationId?: string; MessageGroupId?: string; }
export interface SqsReceiveMessageCommand { QueueUrl: string; MaxNumberOfMessages?: number; VisibilityTimeout?: number; WaitTimeSeconds?: number; }
export interface SqsDeleteMessageCommand { QueueUrl: string; ReceiptHandle: string; }
export interface SqsChangeVisibilityCommand { QueueUrl: string; ReceiptHandle: string; VisibilityTimeout: number; }
export interface SqsClientLike { send(command: { input: unknown }): Promise<any>; }

export class SqsQueueProvider implements QueueProvider {
  readonly kind = 'sqs' as const;
  readonly capabilities: QueueProviderCapabilities = {
    delayedDelivery: true,
    deduplication: false,
    fifo: false,
    batching: true,
    deadLetter: false,
    consumer: true,
    visibilityTimeout: true,
  };

  constructor(private readonly client: SqsClientLike, private readonly queueUrl: (queue: string) => string) {}

  async publish<TBody>(queue: string, message: QueueMessage<TBody>, options: QueuePublishOptions = {}): Promise<QueuePublishResult> {
    const result = await this.client.send({ input: {
      QueueUrl: this.queueUrl(queue),
      MessageBody: JSON.stringify(message),
      DelaySeconds: options.delayMs ? Math.min(900, Math.floor(options.delayMs / 1000)) : undefined,
      MessageDeduplicationId: options.deduplicationId,
      MessageGroupId: options.groupId,
    } satisfies SqsSendMessageCommand });
    return { id: result?.MessageId ?? message.id, provider: this.kind };
  }

  async consume<TBody>(queue: string, handler: QueueHandler<TBody>, options: QueueConsumeOptions = {}): Promise<QueueSubscription> {
    let closed = false;
    const url = this.queueUrl(queue);
    const loop = async () => {
      while (!closed) {
        const result = await this.client.send({ input: {
          QueueUrl: url,
          MaxNumberOfMessages: Math.min(10, options.batchSize ?? 1),
          VisibilityTimeout: Math.ceil((options.visibilityTimeoutMs ?? 30000) / 1000),
          WaitTimeSeconds: 20,
        } satisfies SqsReceiveMessageCommand });
        for (const item of result?.Messages ?? []) {
          const message = JSON.parse(item.Body) as QueueMessage<TBody>;
          await handler({
            message,
            ack: () => this.client.send({ input: { QueueUrl: url, ReceiptHandle: item.ReceiptHandle } satisfies SqsDeleteMessageCommand }).then(() => undefined),
            retry: (retryOptions) => this.client.send({ input: { QueueUrl: url, ReceiptHandle: item.ReceiptHandle, VisibilityTimeout: Math.ceil((retryOptions?.delayMs ?? 0) / 1000) } satisfies SqsChangeVisibilityCommand }).then(() => undefined),
          });
        }
      }
    };
    void loop();
    return { close: () => { closed = true; } };
  }
}
