# ADR-0060 — Event Contracts and Versioning

**Status:** Accepted

Subjects use `figentra.<domain>.<event>.v<version>`. Every event has a stable ID,
contract version, producer, timestamp, correlation ID, optional causation ID,
trusted tenant/actor context where applicable, and validated payload. Breaking
contract changes require a new event version.
