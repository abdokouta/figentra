# Definition of Done for a Platform Service

A service is not production-ready until it has:

## Architecture

- bounded responsibility
- owner
- non-responsibilities
- ADRs
- dependency map

## Security

- authentication
- authorization
- secrets
- least privilege
- threat model
- audit requirements

## API

- version
- contract
- validation
- error model
- timeout
- idempotency

## Data

- schema
- migrations
- ownership
- indexes
- retention

## Events

- event contracts
- outbox if required
- retries
- DLQ
- idempotency

## Operations

- health
- readiness
- logs
- metrics
- traces
- alerts

## Testing

- unit
- integration
- contract
- security
- end-to-end where required

## Deployment

- Terraform
- environment configuration
- secret references
- rollback
- observability
