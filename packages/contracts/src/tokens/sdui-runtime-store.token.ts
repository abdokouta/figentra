/**
 * @file sdui-runtime-store.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token identifying the SDUI runtime's local `$.state`
 *   store when registered with `StateRegistry`.
 *
 *   Renamed from the legacy plural `state-store.tokens.ts` — per
 *   `.kiro/steering/code-standards.md`, new tokens use the singular
 *   `.token.ts` suffix with one `Symbol()` per file. The token
 *   itself is unchanged, so every downstream consumer keeps its
 *   `import { SDUI_RUNTIME_STORE } from "@stackra/contracts"`
 *   working through the barrel.
 */

/**
 * Shared symbol identifying the SDUI runtime's local `$.state` store when
 * registered with `StateRegistry`.
 *
 * `@stackra/sdui`'s `<SduiRuntimeProvider>` registers its per-screen state
 * as a normal store under this token at mount, so schema-level `setState`
 * / `toggleState` actions route through `@stackra/state`'s `SetStateHandler`
 * just like any other DI-managed store — no SDUI-specific branch in the
 * handler.
 */
export const SDUI_RUNTIME_STORE = Symbol.for("SDUI_RUNTIME_STORE");
