/**
 * @file nats-publisher.ts
 * @description NATS JetStream publisher implementation for Node runtimes.
 */
import { jetstream } from "@nats-io/jetstream";
import type { NatsConnection } from "@nats-io/nats-core";
import type { FigentraEventEnvelope } from "@figentra/events";
import type { MessagingEventPublisher } from "./interfaces/messaging-client.interface";
import { MESSAGING_CONSTANTS } from "./constants/messaging.constant";

/**
 * Publishes Figentra events to NATS JetStream.
 */
export class NatsEventPublisher implements MessagingEventPublisher {
  /**
   * @param connection - Authenticated NATS connection.
   */
  public constructor(private readonly connection: NatsConnection) { }

  /**
   * Publishes one validated event.
   *
   * @param event - Event envelope.
   * @throws If the serialized event exceeds the platform limit.
   */
  public async publish<TPayload>(
    event: FigentraEventEnvelope<TPayload>,
  ): Promise<void> {
    const bytes = new TextEncoder().encode(JSON.stringify(event));
    if (bytes.byteLength > MESSAGING_CONSTANTS.MAX_EVENT_BYTES) {
      throw new Error("Figentra event exceeds maximum payload size.");
    }

    const js = jetstream(this.connection);
    const subject = event.subject ?? event.type;
    await js.publish(subject, bytes, { msgID: event.id });
  }
}
