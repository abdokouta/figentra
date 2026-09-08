# Reporting — Messaging

Use durable event consumers for projection updates and SQS-style jobs for long-running execution/export work. Retry with bounded backoff and dead-letter handling. Projection and report jobs are idempotent. Event schemas are versioned in `@stackra/contracts`. Replays rebuild projections without mutating source systems.