/**
 * @file use-system-settings.interface.ts
 * @module @stackra/settings/native/hooks/use-system-settings
 * @description Return type for {@link useSystemSettings}.
 */

/**
 * Return value of {@link useSystemSettings}. `open()` resolves once
 * the system Settings app has been asked to open — the underlying
 * call never fails from the consumer's perspective (fail-soft
 * try/catch inside the hook).
 */
export interface IUseSystemSettingsResult {
  /**
   * Open the OS Settings app for the current bundle.
   *
   * @returns Promise resolving to `true` on success and `false` on
   *   failure — the failure branch fires when the OS refuses to
   *   open Settings (rare) or when the peer is missing at runtime.
   */
  readonly open: () => Promise<boolean>;
}
