# Deployment and Operations

## Deployment

Wrangler is the deployment tool. Use isolated development/staging/production environments with distinct bindings, secrets, routes and Registry scopes. Builds are immutable and reproducible.

## Startup/readiness

Worker initialization validates configuration and obtains a valid route table. Readiness means the Worker can serve public health and has valid routing/security configuration. Registry refresh happens atomically.

## Rollout

Deploy versioned Worker, run smoke/contract tests, observe edge and upstream telemetry, then promote traffic. Rollback is to the last known-good immutable Worker/configuration pair.

## Operations

Runbooks cover route outage, Registry outage, invalid metadata, authentication-key rotation, rate-limit incident, origin outage, elevated 5xx, timeout storm, cache poisoning, credential compromise and emergency route disablement.

## Security operations

Rotate secrets without source changes; revoke compromised credentials; invalidate route metadata when security policy changes; maintain emergency route deny controls.

## Capacity

Track Worker execution, request volume, upstream latency, streaming connections, rate-limit saturation and origin capacity. Gateway must not amplify traffic beyond configured upstream budgets.

## DR

Worker code/configuration is redeployable from source. Registry metadata has authoritative recovery procedures. Gateway stores no business state requiring database restoration.
