/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/tenancy
 * @description Barrel export for tenancy interfaces + the
 *   `HostContext` literal-union pair.
 *
 *   The literal-union pair uses a `const` object + `type` alias
 *   (per `.kiro/steering/frontend-packages.md` §3 — literal unions
 *   never TS `enum {}`) so it's re-exported as BOTH a runtime value
 *   and a type from the same identifier.
 */

// `HostContext` is a const-object + type-alias pair — export the
// runtime object AND the type union under the same identifier.
export { HostContext } from "./host-context.interface";

// Pure interfaces + types below.
export type { IHostContextResolution } from "./host-context-resolution.interface";
export type { IHostResolver } from "./host-resolver.interface";
export type { ISwitchWorkspaceOptions } from "./switch-workspace-options.interface";
export type { ITenancyContextValue } from "./tenancy-context-value.interface";
export type {
  ITenancyService,
  ITenancyServiceSnapshot,
} from "./tenancy-service.interface";
export type { ITenant } from "./tenant.interface";
export type { IWorkspacePickerEntry } from "./workspace-picker-entry.interface";
