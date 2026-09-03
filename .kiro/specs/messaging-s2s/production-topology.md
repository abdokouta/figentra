# Production Topology

Nest services own PostgreSQL and outbox state. Relays publish to NATS JetStream.
Terraform provisions NATS, streams, consumers, credentials and production
infrastructure. Runtime code does not provision infrastructure.
