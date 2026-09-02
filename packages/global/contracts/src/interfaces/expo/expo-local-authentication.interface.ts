/**
 * @file expo-local-authentication.interface.ts
 * @module @stackra/contracts/interfaces/expo
 * @description Canonical structural narrowing of
 *   `expo-local-authentication`'s public surface — Face ID / Touch
 *   ID / fingerprint / iris biometric authentication on iOS +
 *   Android.
 *
 *   The interface exists because `@stackra/auth/native` exported a
 *   local `IExpoLocalAuthenticationModule` shim of the same shape
 *   (§6.2.1 DEMOTE'd) — a pattern
 *   `.kiro/steering/contract-reexports.md` §"Rule — never define a
 *   local `I*Like` structural shim for a missing contract"
 *   explicitly bans for cross-package promotion candidates. Per the
 *   audit's "Third-party runtime shape shim" criterion, every
 *   `IExpo*` shape describing an external Expo module's runtime
 *   surface belongs in a shared workspace contract even when the
 *   current consumer count is one — future Expo consumers reuse
 *   the same shape.
 *
 *   ## Consumers (as of 2026-07-27)
 *
 *   - `@stackra/auth/native` — `ExpoLocalAuthenticationUnlocker`
 *     lazy-imports `expo-local-authentication` and narrows the
 *     resolved module to this shape.
 *
 *   ## iOS Info.plist requirement
 *
 *   iOS 14+ crashes the app at Face ID prompt time when
 *   `NSFaceIDUsageDescription` is missing from `Info.plist`. The
 *   contract doesn't enforce it; consumer apps ship the string.
 */

/**
 * Result shape returned by `expo-local-authentication`'s
 * `authenticateAsync`. The `error` codes are documented at
 * https://docs.expo.dev/versions/latest/sdk/local-authentication/
 * — every consumer maps them to a typed reason union via a local
 * helper.
 */
export interface IExpoAuthenticateResult {
  /** `true` when the OS confirmed the biometric match. */
  readonly success: boolean;
  /**
   * Error code from the peer — one of:
   * `"user_cancel" | "system_cancel" | "user_fallback" |
   * "lockout" | "not_enrolled" | "authentication_failed" |
   * "app_cancel" | "invalid_context" | "not_available" |
   * "passcode_not_set"`. Older SDK versions may return an
   * undocumented string; consumers normalise unknown values.
   */
  readonly error?: string;
  /**
   * Human-readable message from the peer. Consumers ignore it —
   * they branch on the typed reason mapped from `error`.
   */
  readonly warning?: string;
}

/**
 * Structural view of the subset of `expo-local-authentication`'s
 * public API `@stackra/*` packages consume. Every method routes
 * 1:1 to the same-named export on the concrete
 * `expo-local-authentication` module.
 *
 * @example
 * ```typescript
 * import type { IExpoLocalAuthentication } from "@stackra/contracts";
 *
 * async function loadPeer(): Promise<IExpoLocalAuthentication | null> {
 *   try {
 *     const spec = "expo-local-authentication";
 *     const mod = (await import(spec)) as
 *       { default?: IExpoLocalAuthentication } | IExpoLocalAuthentication;
 *     const resolved = mod as IExpoLocalAuthentication;
 *     if (typeof resolved.authenticateAsync === "function") return resolved;
 *     if ("default" in mod && mod.default) return mod.default;
 *     return null;
 *   } catch {
 *     return null;
 *   }
 * }
 * ```
 */
export interface IExpoLocalAuthentication {
  /**
   * Whether the device has biometric hardware.
   *
   * @returns `true` when the OS reports biometric hardware
   *   (Touch ID / Face ID / fingerprint sensor / iris scanner)
   *   is present, regardless of whether the user has enrolled
   *   any credentials.
   */
  hasHardwareAsync(): Promise<boolean>;

  /**
   * Whether the user has enrolled at least one biometric
   * credential.
   *
   * @returns `true` when the enrollment DB is non-empty.
   */
  isEnrolledAsync(): Promise<boolean>;

  /**
   * Prompt the user to authenticate biometrically.
   *
   * @param options - Prompt configuration (message, cancel
   *   label, device-fallback opt-out).
   * @returns Result with `success` flag + optional error code.
   */
  authenticateAsync(options: {
    promptMessage: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<IExpoAuthenticateResult>;
}
