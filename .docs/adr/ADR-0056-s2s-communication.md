# ADR-0056 — Server-to-Server Communication

**Status:** Accepted

Figentra has two communication modes: authenticated synchronous request/response
(HTTP/REST, or NATS request/reply where explicitly justified) and asynchronous
durable events over NATS JetStream.

Commands/queries require a response. Events are immutable facts and do not
require a response. No direct cross-service database access is permitted. NestJS
microservices is an adapter, not the domain protocol.
