# @figentra/outbox

Transactional outbox contracts and persistence/relay primitives.

The service database remains the source of truth; the outbox atomically records
events beside the domain mutation and the relay publishes them to JetStream.
