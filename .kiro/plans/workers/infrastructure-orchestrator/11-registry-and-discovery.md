# Infrastructure Orchestrator — Registry Integration

The Application Registry receives sanitized deployment metadata; it does not become infrastructure authority.

## Published metadata

Application, service, version, environment, deployment ID, artifact digest, manifest hash, runtime status, deployment timestamp, operation status and safe endpoint/runtime metadata.

## Flow

Authorized deployment → durable execution → successful reconciliation → publish deployment projection to Registry. Failed/unknown deployment is never published as healthy. Superseded/rollback deployments update the metadata projection without changing Terraform authority.

## Client

Use the canonical NestJS/Registry integration only in containerized applications; this Worker uses a typed Worker-to-Registry binding/HTTP contract. Publication is authenticated, idempotent and retry-safe.

## Failure

Registry outage never changes actual infrastructure outcome. Deployment operation remains durable and reconciles later. Registry publication failure is visible as metadata-sync failure, not falsely reported as infrastructure failure.