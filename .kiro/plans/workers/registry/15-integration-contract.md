# Registry — NestJS Integration Contract

## Package role

The NestJS Registry integration package is the application-side publisher/client. It does not make the Registry authoritative for application source metadata and does not block service startup.

## Registration payload

Application ID; application version; environment; artifact digest; manifest hash; service ID/version; routes; capabilities; permissions projection; events; consumers; workers; schedules; configuration schema metadata; health/readiness endpoints; realtime channels; webhooks; reports/search metadata; dependencies; deployment metadata; safe branding tokens.

## Lifecycle

Bootstrap loads local manifest → validates locally → computes canonical hash → registers asynchronously → receives publication/revision → exposes registration status. Startup continues if Registry is unavailable. Retry uses bounded exponential backoff and jitter. Publication is idempotent by application/environment/version/hash.

## Runtime API

`RegistryClient.publishManifest`; `registerApplication`; `registerVersion`; `registerEnvironment`; `getPublicationStatus`; `reconcile`; `resolve`. Calls use service/application credentials and W3C/request/correlation context.

## Safety

Never send secrets, tokens, source code, SQL, executable code or business records. Provider-specific metadata is normalized before publication. Registry responses are treated as metadata, never executable configuration.

## Service integration

NestJS services remain authoritative for authentication, authorization, domain logic, transactions, jobs and business events. Registry is metadata/discovery only. Registry outage must not make healthy business services fail readiness unless the specific service contract requires route metadata for serving traffic.