# Location Service — Runtime and Framework

## Framework

NestJS 12 on Node 24 with Fastify. HTTP and NATS use NestJS abstractions.

## Configuration

Configuration is environment-driven and validated at startup. Required production settings include service identity, HTTP port, database URL, NATS endpoints, provider credentials and observability credentials.

## Error handling

Global exception handling converts validation, authorization, provider and infrastructure failures into the stable Location error envelope.

## Graceful shutdown

Stop accepting new requests, drain in-flight HTTP/NATS work, flush telemetry/outbox work where safe, close database connections and then exit. Shutdown has a bounded timeout.

## Documentation

OpenAPI is generated from the HTTP contract in development/staging. Internal NATS contracts are maintained as typed/versioned schemas alongside the service.
