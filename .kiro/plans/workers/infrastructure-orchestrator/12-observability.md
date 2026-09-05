# Infrastructure Orchestrator — Observability

## Logs

Structured records include requestId, correlationId, traceId, operationId, deploymentId, application/environment, provider/resource/action, attempt, transition, duration and safe error code. Never log credentials, Terraform sensitive values or full provider payloads.

## Metrics

Operation accepted/running/succeeded/failed; execution duration; queue depth/age; retries; DLQ; provider latency/errors; lock contention; reconciliation lag; drift count; plan/apply failures; Registry publication failures; authorization rejects.

## Traces

Worker request → authorization → operation persistence → queue dispatch → runner/provider → reconciliation → Registry publication. Propagate W3C trace context.

## SLO/alerts

Control API availability/latency, queue processing latency, successful operation ratio and reconciliation freshness. Alert on sustained provider failures, stuck operations, queue backlog, DLQ growth, drift age, credential failures and error-budget burn.