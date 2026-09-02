/**
 * @file expo-web-browser.interface.ts
 * @module @stackra/contracts/interfaces/expo
 * @description Canonical structural narrowing of `expo-web-browser`'s
 *   in-app authentication browser surface —
 *   `SFAuthenticationSession` on iOS + Chrome Custom Tabs on Android.
 *
 *   Consumed by `@stackra/auth/native`'s `ExpoWebBrowserOpener` for
 *   OAuth redirect flows. `openAuthSessionAsync` opens a system
 *   browser, waits for a redirect matching `redirectUrl` (an
 *   Universal Link or App Link registered by the consumer app), and
 *   resolves with the redirect URL — cleaner than round-tripping
 *   through a WebView with cookie leakage.
 *
 *   ## Consumers (as of 2026-07-27)
 *
 *   - `@stackra/auth/native` — `ExpoWebBrowserOpener` lazy-imports
 *     `expo-web-browser` and narrows the resolved module to this
 *     shape.
 */

/**
 * Result shape returned by `expo-web-browser`'s
 * `openAuthSessionAsync`.
 *
 * `type` maps 1:1 onto `@stackra/auth`'s `IBrowserOpenerResult.type`
 * except for the `unavailable` case, which is only produced by the
 * adapter's fail-soft path (never by the underlying peer).
 */
export interface IExpoAuthSessionResult {
  /**
   * Result discriminator.
   *
   * - `success` — the user reached the registered redirect URL.
   * - `cancel` — the user explicitly cancelled.
   * - `dismiss` — the user dismissed the browser sheet.
   * - `locked` — the OS is preventing a new session (rare).
   */
  readonly type: "success" | "cancel" | "dismiss" | "locked";
  /**
   * The final URL Sentry redirected to. Only present when
   * `type === "success"`.
   */
  readonly url?: string;
}

/**
 * Structural view of the subset of `expo-web-browser`'s public API
 * `@stackra/*` packages consume. Every method routes 1:1 to the
 * same-named export on the concrete `expo-web-browser` module.
 *
 * @example
 * ```typescript
 * import type { IExpoWebBrowser } from "@stackra/contracts";
 *
 * async function loadPeer(): Promise<IExpoWebBrowser | null> {
 *   try {
 *     const spec = "expo-web-browser";
 *     const mod = (await import(spec)) as
 *       { default?: IExpoWebBrowser } | IExpoWebBrowser;
 *     const resolved = mod as IExpoWebBrowser;
 *     if (typeof resolved.openAuthSessionAsync === "function") return resolved;
 *     if ("default" in mod && mod.default) return mod.default;
 *     return null;
 *   } catch {
 *     return null;
 *   }
 * }
 * ```
 */
export interface IExpoWebBrowser {
  /**
   * Open an in-app authentication browser and wait for a redirect.
   *
   * @param url - The URL to open (typically the OAuth provider's
   *   authorization endpoint with `client_id`, `redirect_uri`,
   *   `scope`, and `code_challenge` params).
   * @param redirectUrl - The URL the OS should intercept. Must
   *   match the app's registered Universal Link (iOS) or App
   *   Link (Android) — otherwise the redirect fails and the
   *   session ends in `cancel`.
   * @param options - Optional per-call configuration (Expo ships
   *   many knobs; every consumer uses defaults).
   * @returns The session result.
   */
  openAuthSessionAsync(
    url: string,
    redirectUrl: string,
    options?: Record<string, unknown>,
  ): Promise<IExpoAuthSessionResult>;

  /**
   * Best-effort auth-session completion for warm-start apps that
   * resume mid-auth. Optional — some Expo SDK versions don't ship
   * it; consumers defensively probe with `?.` at the call site.
   *
   * @returns Completion state, or `undefined` when nothing was
   *   in-flight.
   */
  maybeCompleteAuthSession?(): { type: "success" | "failed" } | undefined;
}
