---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/desktop` — secure Electron/Tauri runtime

**Status:** Planned  
**Anchor ADRs:** ADR-0091, ADR-0021  
**Depends on:** `@stackra/container`, `@stackra/node`, `@stackra/storage`, `@stackra/file-system`, `@stackra/navigation`, `@stackra/link`, `@stackra/auth`, `@stackra/notifications`  
**Design effort:** 16 days across 8 phases

## Purpose

Secure desktop composition for Electron and Tauri: isolated renderer, secure IPC, filesystem/credential capabilities, deep links, notifications, auto-update boundary and application lifecycle.

## Non-goals

Business UI, unrestricted Node access from renderer, or a custom desktop framework.

## Manager pattern

No manager; `DesktopRuntime` exposes explicitly granted capabilities through typed IPC contracts.

## Subpath layout

```text
packages/desktop/src/core/{runtime.module.ts,capabilities/,ipc/,lifecycle/,index.ts}
packages/desktop/src/electron/{main/,preload/,ipc/,index.ts}
packages/desktop/src/tauri/{commands/,events/,index.ts}
packages/desktop/src/testing/{ipc-harness.ts,fixtures/,index.ts}
```

## Contracts / API

`@stackra/contracts/desktop` owns IPC command/event contracts and capability tokens. Renderer code can access only explicitly exposed capabilities.

## Security

Electron context isolation, sandboxing and non-node integration are mandatory. IPC validates command names, payload schemas and caller capability. Tauri commands use allowlists. Filesystem paths are rooted and credentials use OS stores. External links are allowlisted.

## Errors / observability

IPC errors normalize through `@stackra/errors`; logs exclude credentials and raw IPC payloads. Audit privileged filesystem/credential operations. Crash/update telemetry is opt-in and privacy-minimized.

## Testing / compatibility

Run contract tests against real Electron/Tauri harnesses where available. Test IPC spoofing, path traversal, navigation, deep links, lifecycle and renderer isolation. Vendor upgrades require security review.

## Phases

1. contracts/scaffold (2d); 2. capability/IPC core (3d); 3. Electron adapter (3d); 4. Tauri adapter (2d); 5. filesystem/credentials/links (2d); 6. security/observability (2d); 7. conformance (1d); 8. docs/release (1d).

## Exit criteria

Renderer has no ambient privileged APIs; IPC is typed/validated; filesystem and credentials are capability-scoped; both supported shells pass security tests.

## Cross-references

`2026-09-03-node-runtime-package.md`, `2026-09-03-file-system-package.md`, `2026-09-03-link-package.md`, ADR-0091.
