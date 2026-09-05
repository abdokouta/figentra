# Integrations Service — Events Contract

Stream: `FIGENTRA_INTEGRATIONS` with canonical event envelope and at-least-once delivery.

Published:
`figentra.integrations.connection.created.v1`
`figentra.integrations.connection.authorized.v1`
`figentra.integrations.connection.failed.v1`
`figentra.integrations.webhook.received.v1`
`figentra.integrations.sync.started.v1`
`figentra.integrations.sync.completed.v1`
`figentra.integrations.sync.failed.v1`
`figentra.integrations.reconciliation.completed.v1`
`figentra.integrations.reconciliation.discrepancy.v1`

Consumed contracts include relevant Tenant lifecycle, Identity service-identity and domain business events required for configured integrations. Consumer actions are idempotent and never mutate foreign databases.

Webhook events are verified and normalized before internal publication. Outbound provider calls do not become events until the result is validated. Transactional outbox protects local mutations.

Secrets/tokens are excluded. Mapping payloads are bounded. Event versions evolve explicitly. DLQ and operator replay are mandatory for poison messages.