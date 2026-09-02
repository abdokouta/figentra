# NATS Production Standard

## Control plane

For V1 production, use a managed NATS control plane such as Synadia Cloud/NGS
rather than operating a stateful NATS cluster ourselves on Cloudflare Workers.
The application remains vendor-portable because it speaks the standard NATS
protocol and uses `@nats-io/transport-node`.

Synadia documents HA clusters/superclusters, per-account users, NATS 2.0
credentials, JWTs, NKeys, and JetStream management.

## Environment isolation

Create separate NATS accounts for:

- dev
- stg
- prd

Do not share service credentials between environments.

## Service identity

Each Figentra service gets a dedicated NATS user/credential with the minimum
publish/subscribe permissions required by its subjects.

Transport authentication is not authorization. Application-level service JWTs
and IAM decisions remain mandatory.

## JetStream

`FIGENTRA_EVENTS` is the default platform stream for durable events. Consumers
must use durable consumer identities and acknowledge successfully processed
messages.

The Terraform `nats/jetstream` module manages the stream after the authenticated
NATS endpoint and credentials have been provisioned.

## Credential rotation

Rotate service NATS credentials without changing source code. Credentials are
injected through Doppler/CI and mounted into the runtime. Old credentials are
revoked only after the replacement connection has been verified.
