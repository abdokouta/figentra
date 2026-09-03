# Gateway + Registry SLOs

These are the initial production SLO targets. They are targets, not claims of
current measured performance.

| Component             | Availability |                 Latency target |  Error budget |
| --------------------- | -----------: | -----------------------------: | ------------: |
| API Gateway           |       99.99% | p95 < 200ms excluding upstream | 52.6 min/year |
| Registry reads        |       99.99% |                    p95 < 150ms | 52.6 min/year |
| Registry writes       |       99.95% |                    p95 < 500ms |  4.38 hr/year |
| Identity verification |       99.99% |          p95 < 100ms cache-hit | 52.6 min/year |
| IAM authorization     |       99.99% |          p95 < 100ms cache-hit | 52.6 min/year |

## Required telemetry

- request count
- status code
- p50/p95/p99 latency
- JWT verification failures
- IAM deny rate
- registry route misses
- route-cache hit ratio
- token-exchange failures
- upstream timeout rate
- circuit-open count
- D1 latency/error rate
- NATS connection/reconnect count
- outbox backlog age
- dead-letter count

## Alerting

Page immediately on:

- sustained 5xx above 1% for five minutes;
- authentication failure spike indicating possible abuse;
- IAM authorization latency or error saturation;
- Registry unavailable;
- outbox backlog exceeding 5 minutes;
- dead-letter growth above the service baseline;
- NATS disconnected for more than 60 seconds in production.
