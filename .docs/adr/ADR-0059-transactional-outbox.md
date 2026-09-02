# ADR-0059 — Transactional Outbox

**Status:** Accepted

Every durable state mutation that emits an event writes the domain mutation and
outbox record in one database transaction. An outbox relay publishes committed
records to JetStream. Direct post-commit publishing is prohibited for durable
events.
