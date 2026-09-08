# Search — Runtime Manifest

Roles: `api`, `consumer`, `worker`, `scheduler`. Endpoints: search, autocomplete, suggest, resources and rebuild. Consumers: registered domain-event streams. Jobs: rebuild, replay, cleanup, synonym refresh. Dependencies: OpenSearch provider adapter, messaging, IAM/RequestContext, observability. Health: liveness, readiness, provider health and consumer lag.