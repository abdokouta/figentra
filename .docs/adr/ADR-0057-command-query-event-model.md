# ADR-0057 — Command, Query and Event Model

**Status:** Accepted

Commands request state-changing work. Queries request current state without
mutation. Events represent meaningful durable state transitions or business/
security facts. Do not publish events for ordinary GETs or database reads.
