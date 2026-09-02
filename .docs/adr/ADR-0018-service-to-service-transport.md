# ADR-0018 — Service-to-Service Transport

## Status

Accepted

## Decision

Use `@nestjs/microservices` as the **Nest transport abstraction**, but do not
use raw `Transport.TCP` as the production platform-wide protocol.

### Production split

- HTTP/JSON through the API Gateway for external/public APIs.
- Internal synchronous calls use a typed internal RPC contract.
- NATS is the default internal broker for service-to-service messaging and
  event-driven communication.
- Kafka remains an explicit option for high-volume durable event streams where
  replay/partitioned log semantics are required.
- Redis is a cache/coordination primitive, not the canonical event bus.
- Raw TCP is permitted only for local development, benchmarks, or a deliberately
  isolated low-latency service where the trade-off is documented.

Nest officially supports request-response and event-based messaging and abstracts
multiple transports behind `@nestjs/microservices`. Its current NATS transport
uses `@nats-io/transport-node` in NestJS v12. citeturn0search0turn0search2

## Why not raw TCP everywhere?

The simple `createMicroservice(... Transport.TCP ...)` API is valid Nest usage,
but it creates a point-to-point transport dependency. It does not give Figentra
the durable pub/sub, queue groups, subject hierarchy, replay-oriented event
architecture, or multi-language broker boundary we want from an enterprise
platform.

Nest itself documents that request-response is not the best fit when an
event-based interaction is sufficient. citeturn0search0

## Service shape

A normal service remains an HTTP application:

```text
main.ts
  NestFactory.create<NestFastifyApplication>(...)
```

and can attach a Nest microservice transport to the same process only when the
service actually consumes messages:

```text
HTTP server
+
optional NATS listener
```

A dedicated worker/consumer is a separate process only when independent scaling
or failure isolation is required.

## Example

```ts
/**
 * Creates the IAM application's HTTP server and optional NATS transport.
 *
 * HTTP remains the service's operational API. NATS is used for internal
 * commands/events and is never exposed as a public API.
 */
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);

app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.NATS,
  options: {
    servers: config.getOrThrow<string[]>('NATS_SERVERS'),
    queue: 'iam',
  },
});
```

This preserves one application composition root while allowing internal
message handlers where required.

## Consequences

Positive:
- Nest abstraction remains available.
- Transport can evolve without rewriting domain/application code.
- NATS provides queue groups and event-based pub/sub.
- Public HTTP API and internal messaging remain clearly separated.

Negative:
- NATS becomes infrastructure to operate.
- Message contracts need versioning and compatibility rules.
- Request-response over a broker needs timeout/retry/idempotency discipline.
