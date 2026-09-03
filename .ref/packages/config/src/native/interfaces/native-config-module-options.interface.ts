/**
 * @file native-config-module-options.interface.ts
 * @module @stackra/config/src/interfaces
 * @description INativeConfigModuleOptions interface.
 */

/**
 * Options for the Native Config Module.
 */
export interface INativeConfigModuleOptions extends IConfigModuleOptions {
  /** AsyncStorage instance for the 'asyncStorage' driver. */
  asyncStorage?: unknown;
  /** Expo Constants instance for the 'expoConstants' driver. */
  expoConstants?: unknown;
  /** Bundled JSON config for the 'bundled' driver. */
  bundledConfig?: Record<string, unknown>;
}
