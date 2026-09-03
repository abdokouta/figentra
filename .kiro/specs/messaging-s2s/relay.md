# Outbox Relay

Claim pending rows with row locking, validate, publish to JetStream, mark
published, retry bounded failures and dead-letter terminal failures. Publication
is at-least-once.
