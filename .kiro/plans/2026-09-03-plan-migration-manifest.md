---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
---
# Plan Migration Manifest

This manifest defines the single canonical location of every plan class. Flat package/service plans are temporary source material only. They are deleted after their content is merged into the canonical implementation-grade document. No redirect, alias, duplicate copy or stub is retained.

## Quality gate
A migrated plan is considered complete only when the canonical file contains concrete ownership/boundary, non-goals, source tree, public API and types, execution semantics, persistence where applicable, drivers/adapters/providers, configuration, discovery/registration where applicable, runtime matrix, security/tenancy, errors/recovery, observability, concurrency/resource limits, testing/conformance, dependencies/exports/versioning, phases and measurable exit criteria. A file being present is not evidence of completion.

## Flat package source → canonical package
| Flat source | Canonical owner | Action |
|---|---|---|
| `2026-09-03-console-package.md` | `packages/tooling/console.md` | migrated + deleted |
| `2026-09-03-events-package.md` | `packages/base/events.md` | migrated/already absent |
| `2026-09-03-errors-package.md` | `packages/base/errors.md` | merge/delete |
| `2026-09-03-exceptions-package.md` | `packages/base/errors.md` | merge/delete |
| `2026-09-03-file-system-package.md` | `packages/base/storage.md` | merge/delete |
| `2026-09-03-encryption-package.md` | `packages/base/security.md` | merge/delete |
| `2026-09-03-hashing-package.md` | `packages/base/security.md` | merge/delete |
| `2026-09-03-health-package.md` | `packages/runtime/nestjs.md` + service contract | merge/delete |
| `2026-09-03-http-package.md` | `packages/base/http.md` | migrated + delete |
| `2026-09-03-i18n-package.md` | `packages/ui/i18n.md` | merge/delete |
| `2026-09-03-identity-package.md` | `packages/capabilities/identity.md` | merge/delete |
| `2026-09-03-link-package.md` | `packages/base/link.md` | merge/delete |
| `2026-09-03-logger-package.md` | `packages/base/logger.md` | merge/delete |
| `2026-09-03-mail-package.md` | `services/notifications.md` | merge/delete |
| `2026-09-03-media-package.md` | `services/files.md` | merge/delete |
| `2026-09-03-nats-package.md` | `packages/base/nats.md` | merge/delete |
| `2026-09-03-navigation-package.md` | `packages/ui/navigation.md` | merge/delete |
| `2026-09-03-nestjs-runtime-package.md` | `packages/runtime/nestjs.md` | merge/delete |
| `2026-09-03-network-package.md` | `packages/base/http.md` + runtime | merge/delete |
| `2026-09-03-node-runtime-package.md` | `packages/runtime/node.md` | merge/delete |
| `2026-09-03-orm-package.md` | `packages/base/orm.md` | merge/delete |
| `2026-09-03-pagination-package.md` | `packages/base/pagination.md` | migrated + deleted |
| `2026-09-03-pipeline-package.md` | `packages/base/pipeline.md` | merge/delete |
| `2026-09-03-query-package.md` | service-specific query owners | merge/delete |
| `2026-09-03-queue-package.md` | `packages/base/nats.md` + worker runtime | merge/delete |
| `2026-09-03-react-native-runtime-package.md` | `packages/runtime/react-native.md` | merge/delete |
| `2026-09-03-react-runtime-package.md` | `packages/runtime/react.md` | merge/delete |
| `2026-09-03-realtime-package.md` | `packages/base/realtime.md` | merge/delete |
| `2026-09-03-redis-package.md` | `packages/base/cache.md` | merge/delete |
| `2026-09-03-response-package.md` | `packages/base/http.md` | merge/delete |
| `2026-09-03-router-package.md` | `packages/ui/router.md` | merge/delete |
| `2026-09-03-schema-package.md` | `packages/base/schema.md` | merge/delete |
| `2026-09-03-search-package.md` | `services/search.md` | merge/delete |
| `2026-09-03-settings-package.md` | config/service settings owners | merge/delete |
| `2026-09-03-state-machine-package.md` | `packages/base/state-machine.md` | merge/delete |
| `2026-09-03-state-package.md` | state-machine/support owner | merge/delete |
| `2026-09-03-storage-package.md` | `packages/base/storage.md` | merge/delete |
| `2026-09-03-support-package.md` | `packages/base/support.md` | merge/delete |
| `2026-09-03-swagger-package.md` | `packages/runtime/nestjs.md` | merge/delete |
| `2026-09-03-sync-package.md` | `packages/capabilities/sync.md` | migrated + deleted |
| `2026-09-03-testing-package.md` | `packages/tooling/testing.md` | merge/delete |
| `2026-09-03-theming-package.md` | `packages/ui/theming.md` | merge/delete |
| `2026-09-03-tracking-package.md` | `packages/capabilities/tracking.md` | merge/delete |
| `2026-09-03-ui-package.md` | `packages/ui/ui.md` | merge/delete |
| `2026-09-03-vite-package.md` | `packages/tooling/vite.md` | merge/delete |
| `2026-09-03-worker-runtime-package.md` | `packages/runtime/worker.md` | merge/delete |
| `2026-09-03-workflow-package.md` | `packages/capabilities/workflow.md` + `services/workflow.md` | merge/delete |
| `2026-09-03-desktop-runtime-package.md` | `packages/runtime/desktop.md` | merge/delete |
| `2026-09-03-coordinator-package.md` | `packages/capabilities/coordinator.md` | merge/delete |
| `2026-09-03-build-tooling-plan.md` | `packages/tooling/build.md` | merge/delete |
| `2026-09-03-cloud-yaml-capability-modules.md` | tooling/build or infrastructure owner | classify/merge/delete |

## Flat service source → canonical service
`identity → services/identity.md`, `tenant → services/tenant.md`, `iam → services/iam.md`, `approval → Workflow (delete standalone)`, `monetization → services/monetization.md`, `entitlements → Monetization (delete standalone)`, `usage → services/usage.md`, `notifications → services/notifications.md`, `audit → services/audit.md`, `files → services/files.md`, `integrations → services/integrations.md`, `search → services/search.md`, `reporting → services/reporting.md`, `analytics → services/analytics.md`, `marketing → services/marketing.md`, `workflow → services/workflow.md`.

## Numeric service specs
The old `.kiro/specs/figentra-platform/services/01-*.md` numbering is legacy. Final service specs use the semantic canonical 14-service catalog. Each numeric legacy document must be merged into its semantic counterpart, references normalized to `@stackra/*`, and then deleted. Standalone Scope/Policy/Approval/Entitlements specs are retired after their useful invariants are moved into Tenant/IAM/Workflow/Monetization.

## Rules for deletion
A source file may be deleted only after:
1. canonical destination exists;
2. useful unique material is merged;
3. canonical content passes the implementation-grade completeness gate;
4. repository references to the old path are updated;
5. obsolete ownership is explicitly recorded here.
