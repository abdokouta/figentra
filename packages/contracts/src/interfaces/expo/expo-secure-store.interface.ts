/**
 * @file expo-secure-store.interface.ts
 * @module @stackra/contracts/interfaces/expo
 * @description Canonical structural narrowing of
 *   `expo-secure-store`'s public surface — iOS Keychain / Android
 *   Keystore key-value substrate. Encrypted at rest; readable only
 *   while the device is unlocked (SecureStore's `WHEN_UNLOCKED`
 *   default).
 *
 *   The interface exists because `@stackra/storage/native` shipped a
 *   local `IExpoSecureStoreModule` shim of the same shape. §6.2.3 of
 *   `.kiro/backlog-frontend-2026-07-27.md` scheduled a verdict —
 *   this promotion closes it as PROMOTE-TO-CONTRACTS alongside the
 *   sibling Expo module shims. Same rationale as
 *   `IExpoLocalAuthentication` + `IExpoWebBrowser`: every `IExpo*`
 *   shape describing an external Expo module's runtime surface
 *   belongs in a shared workspace contract.
 *
 *   ## Consumers (as of 2026-07-27)
 *
 *   - `@stackra/storage/native` — `ExpoSecureStoreDriver` lazy-imports
 *     `expo-secure-store` and narrows the resolved module to this
 *     shape. Registered under the manager driver name
 *     `expoSecureStore`.
 */

/**
 * Structural view of the subset of `expo-secure-store`'s public
 * API `@stackra/*` packages consume. Every method routes 1:1 to
 * the same-named export on the concrete `expo-secure-store`
 * module.
 *
 * @remarks Marked `readonly`-friendly on every method because the
 *   peer module is imported at runtime and never mutated.
 *
 * @example
 * ```typescript
 * import type { IExpoSecureStore } from "@stackra/contracts";
 *
 * async function loadPeer(): Promise<IExpoSecureStore | null> {
 *   try {
 *     const spec = "expo-secure-store";
 *     const mod = (await import(spec)) as
 *       { default?: IExpoSecureStore } | IExpoSecureStore;
 *     return "default" in mod && mod.default
 *       ? mod.default
 *       : (mod as IExpoSecureStore);
 *   } catch {
 *     return null;
 *   }
 * }
 * ```
 */
export interface IExpoSecureStore {
  /**
   * Read a value from the keychain / keystore.
   *
   * @param key - The lookup key. Prefixing (namespacing) is the
   *   caller's responsibility.
   * @returns The persisted string, or `null` when the key is
   *   absent.
   */
  getItemAsync(key: string): Promise<string | null>;

  /**
   * Write a value to the keychain / keystore. Overwrites any
   * existing value at the same key.
   *
   * @param key - The lookup key.
   * @param value - The string to persist. Callers serialise
   *   non-string values themselves (JSON, base64, etc.).
   */
  setItemAsync(key: string, value: string): Promise<void>;

  /**
   * Delete a value. No-op if the key is absent.
   *
   * @param key - The lookup key.
   */
  deleteItemAsync(key: string): Promise<void>;
}
