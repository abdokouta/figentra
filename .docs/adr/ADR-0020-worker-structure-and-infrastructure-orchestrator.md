# ADR-0020 — Worker structure and Infrastructure Orchestrator

## Status
Accepted

## Context
Figentra Workers are becoming control-plane components and must remain easy to
review, test, and operate. Terraform requires a real process/filesystem runtime
and should not be executed directly inside a request Worker.

## Decision
1. Every Worker uses `src/index.ts` as a thin runtime entrypoint and `src/app.ts`
   as the Hono composition root.
2. Every exported interface/type/enum/constant/schema gets its own appropriately
   suffixed file.
3. Registry D1 executable schema lives only under `database/migrations`;
   `database/schema.sql` is a generated snapshot.
4. `infrastructure-orchestrator` is a Worker control plane. It authenticates,
   authorizes, records job intent, and starts a durable Workflow.
5. Terraform executes only in an isolated Cloudflare Container. The Worker never
   executes shell commands.
6. Terraform source is pinned to an exact Git revision; production mutation
   requires both IAM permission and an approval/change reference.

## Rationale
Cloudflare Containers provide a Linux runtime and process execution model suitable
for Terraform, while Workers provide the authenticated API and control plane.
Cloudflare Workflows provides durable multi-step orchestration and retries.
