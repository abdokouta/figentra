---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
scope: package-source-and-api-contracts
---
# Package Source Contract Matrix

This matrix complements the package catalog with exact implementation locations, primary files and mandatory public methods. The directory names are the contract; implementations may add private files without changing ownership or exports.

## Base packages

### `@stackra/cache`
```text
packages/base/cache/src/{cache-manager,cache-key,cache-policy,cache-store,errors,index.ts}
packages/base/cache/src/redis/{redis-store,redis-lock,index.ts}
packages/base/cache/tests/{unit,conformance,integration}/
```
API: `get`, `set`, `delete`, `has`, `wrap`, `remember`, `invalidate`, `invalidatePattern`, `lock`; metrics for hit/miss/latency; Redis only through `/redis`.

### `@stackra/config`
```text
packages/base/config/src/{config,loader,source,parser,schema,secret-ref,errors,index.ts}
```
API: `defineConfig`, `loadConfig`, `resolve`, `require`, `getSecretRef`, `validate`; sources env/file/remote-secret through typed adapters.

### `@stackra/container`
```text
packages/base/container/src/{container,bindings,scope,lifecycle,errors,index.ts}
packages/base/container/src/testing/{container-fixture,index.ts}
```
API: `bind`, `singleton`, `scoped`, `transient`, `resolve`, `createScope`, `dispose`; runtime adapters isolated in subpaths.

### `@stackra/contracts`
```text
packages/base/contracts/src/{envelope,request-context,commands,queries,events,errors,ids,versioning,index.ts}
packages/base/contracts/src/versioning/{compatibility,migrations,index.ts}
```
API: versioned DTO/event/command/query schemas, `assertCompatible`, `parse`, `serialize`; no service implementation dependencies.

### `@stackra/events`
```text
packages/base/events/src/{event,event-type,event-registry,publisher,consumer,errors,index.ts}
```
API: `defineEvent`, `registerEvent`, `publish`, `subscribe`, `deserialize`; business facts only, transport handled by adapters.

### `@stackra/http`
```text
packages/base/http/src/{client,request,response,middleware,retry,circuit-breaker,cache,errors,index.ts}
packages/base/http/src/{fetch,axios,rxjs,nestjs,native,worker,actions,config,network,response,rate-limit,cookie}/index.ts
packages/base/http/tests/{unit,conformance,e2e}/
```
API: `get/post/put/patch/delete`, `request`, `stream`, `upload`, `download`, middleware/interceptor registration, retries, timeout, cancellation, ETag; vendor/runtime connectors only under subpaths.

### `@stackra/i18n`
```text
packages/ui/i18n/src/{catalog,locale,resolver,formatter,pluralization,errors,index.ts}
packages/ui/i18n/src/{react,native,nestjs}/index.ts
```
API: `translate`, `formatDate`, `formatNumber`, `resolveLocale`, `loadCatalog`, `hasKey`; locale negotiation and fallback are deterministic.

### `@stackra/logger`
```text
packages/base/logger/src/{logger,level,context,redaction,sinks,index.ts}
packages/base/logger/src/{pino,winston,nestjs,worker,react,testing}/index.ts
```
API: `trace/debug/info/warn/error/fatal`, `child`, `withContext`, `redact`; operational logs only.

### `@stackra/media`
```text
packages/capabilities/media/src/core/{media,upload,checksum,mime,scan,retention,index.ts}
packages/capabilities/media/src/{storage,nestjs,worker,react,native,testing}/index.ts
```
API: `createUpload`, `completeUpload`, `inspect`, `checksum`, `scan`, `signDownload`, `delete`; Files service owns durable file metadata.

### `@stackra/network`
Canonical path: `@stackra/http/network`.
Files: `src/network/{connectivity,dns,backoff,reachability,index.ts}`. API: `isOnline`, `waitForOnline`, `measure`, `classifyNetworkError`.

### `@stackra/pagination`
```text
packages/base/pagination/src/{request,links,length-aware,simple,cursor,filters,errors,index.ts}
```
API: `paginate`, `fromCursor`, `toLinks`, `parsePaginationRequest`; all service collection endpoints use it.

### `@stackra/pipeline`
```text
packages/base/pipeline/src/{pipeline,stage,context,executor,errors,index.ts}
```
API: `use`, `execute`, `executeBatch`, `compose`; supports bounded concurrency/cancellation.

### `@stackra/orm`
```text
packages/base/orm/src/{entity-metadata,repository,unit-of-work,identity-map,locks,tenant-filter,soft-delete,index.ts}
packages/base/orm/src/{mikroorm,testing}/index.ts
```
API: `find`, `findOne`, `persist`, `remove`, `flush`, `transaction`, `lock`, `withTenant`, `query`; ORM never owns DB transport.

### `@stackra/redis`
Canonical path: `@stackra/cache/redis`. No root package. See cache adapter contract.

### `@stackra/response`
Canonical path: `@stackra/http/response`. Files: `response-envelope.ts`, `error-response.ts`, `headers.ts`, `etag.ts`, `serializer.ts`.

### `@stackra/rate-limit`
Canonical path: `@stackra/http/rate-limit`. Files: `policy.ts`, `limiter.ts`, `redis.ts`, `memory.ts`, `worker.ts`. API: `check`, `consume`, `reset`, `remaining`.

### `@stackra/link`
```text
packages/base/link/src/{link,rel,uri,parser,builder,index.ts}
```
API: `build`, `parse`, `normalize`, `resolve`, `isExternal`; safe URL handling only.

### `@stackra/storage`
```text
packages/base/storage/src/{store,object,key,metadata,errors,index.ts}
packages/base/storage/src/{filesystem,s3,r2,supabase,testing}/index.ts
```
API: `put`, `get`, `head`, `delete`, `list`, `signedUrl`, `exists`; provider adapters do not leak types.

### `@stackra/health`
```text
packages/base/health/src/{check,registry,readiness,liveness,dependency,index.ts}
packages/base/health/src/{nestjs,node,worker}/index.ts
```
API: `registerCheck`, `checkHealth`, `readiness`, `liveness`, `checkDependency`.

### `@stackra/observability`
```text
packages/base/observability/src/{provider,context,metrics,resource,errors,index.ts}
packages/base/observability/src/tracing/{tracer,propagation,span,index.ts}
```
API: `startSpan`, `withSpan`, `counter`, `histogram`, `gauge`, context propagation; OTel is the implementation boundary.

### `@stackra/security`
```text
packages/base/security/src/{policy,secret-ref,sanitization,url,index.ts}
packages/base/security/src/{encryption,hashing,csp}/index.ts
```
API: policy evaluation helpers, `encrypt/decrypt`, `hash/verify`, `buildCsp`.

### `@stackra/schema`
```text
packages/base/schema/src/{schema,validator,coercion,serialization,errors,index.ts}
```
API: `defineSchema`, `parse`, `safeParse`, `validate`, JSON Schema export.

### `@stackra/state-machine`
```text
packages/base/state-machine/src/{machine,state,transition,guard,effect,errors,index.ts}
```
API: `defineMachine`, `transition`, `can`, `current`, `serialize`.

### `@stackra/coordinator`
```text
packages/base/coordinator/src/{coordinator,lease,lock,checkpoint,orchestrator,errors,index.ts}
```
API: `claim`, `release`, `checkpoint`, `run`, `recover`; generic infrastructure only, not business workflow.

## Capability packages

### `@stackra/identity`
```text
packages/capabilities/identity/src/core/{principal,identity,credentials,provider-link,delegation,index.ts}
packages/capabilities/identity/src/{session,react,native,nestjs,http,testing}/index.ts
```
API: `getPrincipal`, `signIn`, `signOut`, `refresh`, `linkProvider`, `createServiceIdentity`, `assumeDelegation`; frontend hooks expose current principal/session only.

### `@stackra/scope`
```text
packages/capabilities/scope/src/core/{scope,store,resolver,context,index.ts}
packages/capabilities/scope/src/{react,native,http,nestjs,testing}/index.ts
```
API: `get`, `set`, `clear`, `listAvailable`, `validate`; React: `useScope`, `ScopeSwitcher`, `TenantSwitcher`, `OrganizationSwitcher`.

### `@stackra/search`
```text
packages/capabilities/search/src/core/{query,index,document,filters,facets,ranking,reindex,errors,index.ts}
packages/capabilities/search/src/{meilisearch,elastic,algolia,nestjs,worker,indexer,testing}/index.ts
```
API: `search`, `index`, `remove`, `bulk`, `reindex`, `createIndex`, `rebuild`, `swapAlias`, `getCapabilities`.

### `@stackra/sdui`
```text
packages/capabilities/sdui/src/core/{document,node,component,binding,action,layout,validation,index.ts}
packages/capabilities/sdui/src/{schema,react,react-native,nestjs,testing}/index.ts
```
API: `validateDocument`, `resolveBindings`, `render`, `registerComponent`, `migrateDocument`.

### `@stackra/page-builder`
```text
packages/capabilities/page-builder/src/{document,commands,selection,history,drag-drop,bindings,index.ts}
packages/capabilities/page-builder/src/{editor,react,blocks,registry,testing}/index.ts
```
API: commands `insert/delete/move/duplicate/updateProps/updateBindings/updateStyles/wrap/unwrap/replace`; state `select/hover/setBreakpoint/undo/redo`.

### `@stackra/dashboard`
```text
packages/capabilities/dashboard/src/core/{dashboard,widget,layout,filters,presets,sharing,index.ts}
packages/capabilities/dashboard/src/{react,native,nestjs,testing}/index.ts
```
API: `load/save/publish/restore`, `addWidget/removeWidget/moveWidget/resizeWidget`, `setFilters`, `createShare`, `revokeShare`; NestJS: `DashboardPersistenceAdapter` and controller factories.

### `@stackra/reporting`
```text
packages/capabilities/reporting/src/core/{definition,dataset,query-ast,filters,sort,aggregation,export,index.ts}
packages/capabilities/reporting/src/{react,native,nestjs,http,testing}/index.ts
```
API: `listDatasets`, `createDefinition`, `preview`, `query`, `startExport`, `getJob`, `schedule`, `cancelSchedule`.

### `@stackra/seo`
```text
packages/capabilities/seo/src/core/{document,resolver,precedence,policy,url,validation,index.ts}
packages/capabilities/seo/src/{schema,react,native,nestjs,sitemap,robots,json-ld,http,testing}/index.ts
```
API: `resolve`, `validate`, `canonical`, `alternates`, `buildJsonLd`, `buildSitemap`, `buildRobots`.

### `@stackra/tracking`
```text
packages/capabilities/tracking/src/core/{event,context,identity,consent,queue,index.ts}
packages/capabilities/tracking/src/{browser,react,native,desktop,http,testing}/index.ts
```
API: `init`, `track`, `page`, `identify`, `group`, `flush`, `reset`; consent gates enforced.

### `@stackra/sync`
```text
packages/capabilities/sync/src/core/{operation,queue,conflict,checkpoint,sync-engine,index.ts}
packages/capabilities/sync/src/{react,native,nestjs,http,storage,testing}/index.ts
```
API: `enqueue`, `sync`, `pull`, `push`, `resolveConflict`, `checkpoint`, `retry`.

### `@stackra/queue`
```text
packages/capabilities/queue/src/core/{queue,job,processor,retry,dlq,concurrency,index.ts}
packages/capabilities/queue/src/{bullmq,nats,cloudflare-queues,broadcast-channel,indexeddb,qstash,nestjs,react,worker,testing}/index.ts
```
API: `enqueue`, `enqueueBatch`, `schedule`, `cancel`, `retry`, `pause`, `resume`, `registerProcessor`, `ack`, `nack`.

### `@stackra/scheduler`
```text
packages/capabilities/scheduler/src/core/{schedule,occurrence,timezone,lease,catch-up,index.ts}
packages/capabilities/scheduler/src/{nestjs,cron,testing}/index.ts
```
API: `next`, `claimDue`, `complete`, `create`, `update`, `disable`.

### `@stackra/audit`
```text
packages/capabilities/audit/src/{event,submission,client,errors,index.ts}
packages/capabilities/audit/src/{nestjs,react,native,testing}/index.ts
```
API: `record`, `recordBatch`, `flush`, `withAuditContext`; durable records belong to Audit service.

### `@stackra/pwa`
```text
packages/capabilities/pwa/src/core/{manifest,policy,update,index.ts}
packages/capabilities/pwa/src/{browser,react,service-worker,testing}/index.ts
```
API: `register`, `checkForUpdate`, `activateUpdate`, `requestInstall`, `getInstallState`.

### `@stackra/kbd`
```text
packages/capabilities/kbd/src/core/{shortcut,registry,scope,parser,conflict,index.ts}
packages/capabilities/kbd/src/{react,desktop,testing}/index.ts
```
API: `register`, `unregister`, `dispatch`, `list`, `enableScope`.

### `@stackra/ai`
```text
packages/capabilities/ai/src/core/{model,request,response,tool,stream,safety,index.ts}
packages/capabilities/ai/src/{openai,anthropic,google,embeddings,rag,nestjs,react,testing}/index.ts
```
API: `generate`, `stream`, `embed`, `structured`, `registerTool`, `retrieve`.

### `@stackra/collaboration`
```text
packages/capabilities/collaboration/src/core/{session,presence,operation,version,conflict,index.ts}
packages/capabilities/collaboration/src/{react,native,realtime,commands,testing}/index.ts
```
API: `join`, `leave`, `publish`, `subscribe`, `presence`, `reconcile`.

### `@stackra/consent`
```text
packages/capabilities/consent/src/core/{state,category,policy,decision,index.ts}
packages/capabilities/consent/src/{react,native,nestjs,http,testing}/index.ts
```
API: `get`, `has`, `request`, `revoke`, `record`, `resolvePolicy`.

### `@stackra/webhook`
```text
packages/capabilities/webhook/src/core/{envelope,signature,verification,delivery,retry,index.ts}
packages/capabilities/webhook/src/{hmac,http,nestjs,testing}/index.ts
```
API: `sign`, `verify`, `send`, `classifyResponse`, `dedupe`.

## UI/runtime packages

### `@stackra/router`, `@stackra/i18n`, `@stackra/theming`
Each has `src/core` plus `src/react`, `src/native`, `src/testing`; no framework-specific business logic. Router API: `match`, `navigate`, `redirect`, `guard`, `buildUrl`. Theme API: `defineTheme`, `resolveTokens`, `setTheme`, `useTheme`.

### `@stackra/desktop`
Runtime foundation under `packages/runtime/desktop`: `src/{window,protocol,filesystem,notifications,security,update,index.ts}`; API `createWindow`, `registerProtocol`, `checkForUpdate`.

## Tooling

### `@stackra/console`
`packages/tooling/console/src/{command,kernel,discovery,module,config,exit,index.ts}`; public API `defineCommand`, `run`, `register`, `discover`, `publishConfig`.

### `@stackra/testing`
`packages/tooling/testing/src/{fixtures,fakes,conformance,http,nats,queue,renderer,index.ts}`; public API `createFixture`, `assertConforms`, `mockHttp`, `mockEvent`, `runE2E`.

### `@stackra/openapi` / Swagger
`packages/tooling/openapi/src/{document,decorators,generator,client,index.ts}` plus `swagger/index.ts`; API `defineDocument`, `generate`, `exportJson`, `mountSwagger`.

## Subpath-only requested names

`session` → `@stackra/identity/session`; `email` → `@stackra/notifications/email`; `slack` → `@stackra/notifications/slack`; `redis` → `@stackra/cache/redis`; `network/response/rate-limit/cookie` → `@stackra/http/*`; `encryption/hashing/csp` → `@stackra/security/*`; `tracing` → `@stackra/observability/tracing`; `versioning` → `@stackra/contracts/versioning`; `indexer` → `@stackra/search/indexer`; `pubsub` → `@stackra/nats/pubsub`; `swagger` → `@stackra/openapi/swagger`.
