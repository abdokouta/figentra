# ADR-0065 — Event Sourcing and Workflow Boundary

**Status:** Accepted

Figentra is event-driven, not globally event-sourced. PostgreSQL remains the
authoritative state store for ordinary services. Do not build a proprietary
event store. JetStream provides durable event transport/replay within retention.
Use a dedicated event-sourcing store only for a domain whose requirements
explicitly justify it. Durable long-running workflows belong to the workflow
boundary.
