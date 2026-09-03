/**
 * @file vite-config-plugin-options.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IViteConfigPluginOptions interface.
 */

/**
 * Options for the Stackra config Vite plugin.
 */
export interface IViteConfigPluginOptions {
  /** Directory to scan for config files. Default: 'config'. */
  configDir?: string;
  /** Glob patterns to include. Default: all .config.ts/.ts/.json files. */
  include?: string[];
  /** Environment variables to inject into `window.__APP_CONFIG__`. */
  envPrefix?: string | string[];
  /** Generate TypeScript declarations for the virtual module. */
  dts?: boolean;
  /** Output path for generated .d.ts file. */
  dtsPath?: string;
}
