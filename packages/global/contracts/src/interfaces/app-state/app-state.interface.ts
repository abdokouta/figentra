/**
 * @file app-state.interface.ts
 * @module @stackra/contracts/interfaces/app-state
 * @description Canonical structural narrowing of React Native's
 *   `AppState` module surface — the foreground / background lifecycle
 *   signal every `@stackra/*` package consumes when it needs to react
 *   to the app entering or leaving the foreground.
 *
 *   The interface exists because four `@stackra/*` packages
 *   (collaboration, realtime, sync, plus a hook inside collaboration)
 *   each carried an identical local `AppStateLike` shim of the same
 *   shape — a pattern `.kiro/steering/contract-reexports.md` §"Rule —
 *   never define a local `I*Like` structural shim for a missing
 *   contract" explicitly bans. The multi-consumer test in
 *   `.kiro/steering/contracts-and-decorators-promotion.md` §"Test A"
 *   is met (4 separately-owned packages), so the correct fix is to
 *   promote the interface into `@stackra/contracts` and have every
 *   consumer `import type { IAppState } from "@stackra/contracts"`.
 *
 *   ## Consumers (as of 2026-07-27)
 *
 *   - `@stackra/collaboration/native` — `AppStateConnectionService`
 *     (pauses / resumes the WebSocket on foreground/background).
 *   - `@stackra/collaboration/native` — `useConnectionLifecycle` hook
 *     (surfaces `isPaused` to consumer UIs).
 *   - `@stackra/realtime/native` — `AppStateListener` (fires
 *     `APP_STATE_EVENTS.CHANGED` on the event bus for downstream
 *     realtime consumers).
 *   - `@stackra/sync/native` — `AppStateChangeListener` (pauses the
 *     sync engine's background poll when the app backgrounds).
 *
 *   ## Why structural narrowing (not the full `AppState` type)
 *
 *   `react-native`'s `AppState` module ships a much wider surface than
 *   the four callers need — the full `AppStateStatus` union
 *   (`'active' | 'inactive' | 'background' | 'unknown' | 'extension'`),
 *   `removeEventListener`, memory-warning subscriptions, etc. Every
 *   consumer here narrows to the same two-property subset. The
 *   narrower shape:
 *
 *   - Keeps `react-native` OPTIONAL — packages that don't ship a
 *     native subpath (or that skip the AppState wiring) don't force
 *     `react-native` into the consumer's install graph.
 *   - Documents the exact surface every consumer relies on — future
 *     drift shows up here in one place instead of four.
 *   - Types the raw `state` argument as `string` — every consumer
 *     immediately narrows to their local two-state (foreground /
 *     background) enum via a helper, so tighter typing at the
 *     contract level would just get discarded.
 *
 *   ## Third-party narrowing exemption
 *
 *   `contract-reexports.md`'s `I<Name>Like` ban targets structural
 *   shims that mirror an EXISTING RUNTIME TYPE inside the workspace.
 *   RN's `AppState` is a third-party module surface, not a workspace
 *   contract — narrowing it via a purpose-built named interface (with
 *   this docblock naming the consumers + the drift concern the audit
 *   raised) is the correct promotion outcome, not a violation. Same
 *   pattern as the sibling `INativeNavigation` promotion in
 *   `interfaces/navigation/`.
 */

/**
 * Structural view of the subset of `react-native`'s `AppState` module
 * consumed by every `@stackra/*` package that reacts to the
 * foreground / background lifecycle.
 *
 * Every property + method routes 1:1 to the corresponding member on
 * the concrete `AppState` module returned by
 * `require('react-native').AppState`. The narrower shape keeps
 * `react-native` OPTIONAL in every consumer's peer dependency table.
 *
 * @example Attach a listener + read the current state
 * ```typescript
 * import type { IAppState } from "@stackra/contracts";
 *
 * async function loadAppState(): Promise<IAppState | null> {
 *   try {
 *     const spec = "react-native";
 *     const rn = (await import(spec)) as { AppState?: IAppState };
 *     return rn.AppState ?? null;
 *   } catch {
 *     return null;
 *   }
 * }
 *
 * const appState = await loadAppState();
 * if (appState) {
 *   const initial = appState.currentState;
 *   const sub = appState.addEventListener("change", (raw) => {
 *     console.log("state changed to", raw);
 *   });
 *   // …later: sub.remove();
 * }
 * ```
 */
export interface IAppState {
  /**
   * The current app state string. Values follow RN's own vocabulary
   * (`'active' | 'inactive' | 'background' | 'unknown' | 'extension'`);
   * every consumer narrows this to a two-state (foreground /
   * background) enum via a local helper — only `'active'` is
   * treated as foreground.
   */
  readonly currentState: string;

  /**
   * Register a native `change` listener. The returned subscription
   * exposes a `.remove()` method that MUST be called on teardown to
   * avoid leaking the listener across HMR reloads or module
   * re-registration.
   *
   * @param type - Event type — only `"change"` is supported.
   *   RN also ships a `"memoryWarning"` event on iOS, but no
   *   `@stackra/*` package consumes it today.
   * @param listener - Callback invoked with the raw app state string
   *   on every transition. Never called synchronously with the
   *   initial state — consumers read `currentState` for that.
   * @returns Subscription handle with `remove()` for detach.
   */
  addEventListener(
    type: "change",
    listener: (state: string) => void,
  ): { remove(): void };
}
