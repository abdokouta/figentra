/**
 * @file index.ts
 * @description Transport-neutral service-to-service messaging adapters for
 * Figentra, implemented with NestJS microservices and NATS v3.
 *
 * Business modules depend on `RpcClient` and `EventBus`. They must not import
 * Nest `ClientProxy`, NATS subjects, or NATS connection primitives directly.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ClientProxyFactory, Transport, type ClientProxy, type MicroserviceOptions } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import type { MessageEnvelope } from "@stackra/contracts";

/**
 * NATS TLS configuration supplied by secret/runtime configuration.
 */
export interface NatsTlsOptions {
  /** PEM-encoded CA certificate. */
  readonly ca?: string;
  /** PEM-encoded client certificate. */
  readonly cert?: string;
  /** PEM-encoded client private key. */
  readonly key?: string;
}

/**
 * Service-scoped NATS connection configuration.
 */
export interface NatsClientOptions {
  /** NATS server URLs. */
  readonly servers: readonly string[];
  /** Queue group used by event consumers. */
  readonly queue?: string;
  /** Stable client name for observability. */
  readonly name: string;
  /** Optional username/password authentication. */
  readonly user?: string;
  /** Optional username/password authentication. */
  readonly pass?: string;
  /** Optional token authentication. */
  readonly token?: string;
  /** Optional TLS settings. */
  readonly tls?: NatsTlsOptions;
  /** Maximum reconnect attempts; -1 means unlimited. */
  readonly maxReconnectAttempts?: number;
}

/**
 * Internal request/response messaging port.
 */
export interface RpcClient {
  /** Sends a typed request to an internal service. */
  send<TResponse, TPayload = unknown>(
    subject: string,
    payload: MessageEnvelope & { payload: TPayload },
  ): Promise<TResponse>;
}

/**
 * Internal event publishing port.
 */
export interface EventBus {
  /** Publishes an event without exposing NATS to the caller. */
  publish<TPayload>(
    subject: string,
    event: MessageEnvelope & { payload: TPayload },
  ): Promise<void>;
}

/**
 * Creates the Nest NATS microservice transport options for a service.
 *
 * @param options - Service-specific NATS connection settings.
 * @returns Nest microservice options ready for `connectMicroservice()` or
 * `createMicroservice()`.
 */
export function createNatsMicroserviceOptions(options: NatsClientOptions): MicroserviceOptions {
  return {
    transport: Transport.NATS,
    options: {
      servers: [...options.servers],
      queue: options.queue,
      name: options.name,
      user: options.user,
      pass: options.pass,
      token: options.token,
      tls: options.tls,
      maxReconnectAttempts: options.maxReconnectAttempts ?? -1,
      gracefulShutdown: true,
      gracePeriod: 10_000,
    },
  } as MicroserviceOptions;
}

/**
 * Provides the Figentra messaging port over NestJS and NATS.
 * @remarks The adapter owns transport concerns; application code depends on ports.
 */
@Injectable()
export class NatsMessagingAdapter implements RpcClient, EventBus, OnModuleInit, OnModuleDestroy {
  private client?: ClientProxy;

  /**
   * @param options - Runtime NATS configuration.
   */
  public constructor(private readonly options: NatsClientOptions) {}

  /** Connects the adapter during Nest startup. */
  public async onModuleInit(): Promise<void> {
    this.client = ClientProxyFactory.create(createNatsMicroserviceOptions(this.options));
    await this.client.connect();
  }

  /** Closes the NATS client during graceful application shutdown. */
  public async onModuleDestroy(): Promise<void> {
    await this.client?.close();
    this.client = undefined;
  }

  /** Sends a request and waits for the typed response. */
  public async send<TResponse, TPayload>(
    subject: string,
    payload: MessageEnvelope & { payload: TPayload },
  ): Promise<TResponse> {
    if (!this.client) throw new Error("NATS messaging adapter is not initialized");
    return firstValueFrom(this.client.send<TResponse, typeof payload>(subject, payload));
  }

  /** Publishes an event without exposing NATS to business code. */
  public async publish<TPayload>(
    subject: string,
    event: MessageEnvelope & { payload: TPayload },
  ): Promise<void> {
    if (!this.client) throw new Error("NATS messaging adapter is not initialized");
    await firstValueFrom(this.client.emit(subject, event));
  }
}

/** Public barrel export. */
export { NatsEventPublisher } from "./nats-publisher.js";
