/**
 * @file stackra-config.plugin.ts
 * @module @stackra/config/vite
 * @description Vite build plugin for the config system.
 *   Scans config files at build time, generates a virtual module
 *   (`virtual:stackra-config`), injects `window.__APP_CONFIG__` for the
 *   EnvDriver, and supports HMR in development mode.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Vite Plugin interface (subset for type safety without importing vite).
 */
interface IVitePlugin {
  name: string;
  resolveId?(id: string): string | null | undefined;
  load?(id: string): string | null | undefined | Promise<string | null | undefined>;
  configureServer?(server: any): void;
  transformIndexHtml?(html: string): string;
}

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════

const VIRTUAL_MODULE_ID = 'virtual:stackra-config';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

// ════════════════════════════════════════════════════════════════════════════════
// Plugin
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Stackra config Vite plugin.
 *
 * Features:
 * - Scans `config/` directory at build time
 * - Generates `virtual:stackra-config` virtual module with merged config
 * - Injects `window.__APP_CONFIG__` into index.html for runtime env access
 * - Watches config files for HMR in development
 * - Optionally generates .d.ts declarations for the virtual module
 *
 * @param options - Plugin options
 * @returns A Vite plugin
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { IdefineConfig } from 'vite';
 * import { stackraConfigPlugin } from '@stackra/config/vite';
 *
 * export default IdefineConfig({
 *   plugins: [
 *     stackraConfigPlugin({
 *       configDir: 'config',
 *       envPrefix: ['VITE_', 'APP_'],
 *       dts: true,
 *     }),
 *   ],
 * });
 * ```
 */
export function stackraConfigPlugin(options: IViteConfigPluginOptions = {}): IVitePlugin {
  const configDir = options.configDir ?? 'config';
  const envPrefixes = Array.isArray(options.envPrefix)
    ? options.envPrefix
    : options.envPrefix
      ? [options.envPrefix]
      : ['VITE_'];

  let resolvedConfigDir: string;

  return {
    name: 'stackra-config',

    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      return null;
    },

    async load(id: string) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return null;

      resolvedConfigDir = path.resolve(process.cwd(), configDir);

      if (!fs.existsSync(resolvedConfigDir)) {
        return 'export default {};';
      }

      const config = await scanAndMergeConfigs(resolvedConfigDir);
      const code = `export default ${JSON.stringify(config, null, 2)};`;

      // Generate .d.ts if requested
      if (options.dts) {
        const dtsPath =
          options.dtsPath ?? path.resolve(process.cwd(), 'config/@types/virtual-module.d.ts');
        generateDeclarations(config, dtsPath);
      }

      return code;
    },

    configureServer(server: any) {
      resolvedConfigDir = path.resolve(process.cwd(), configDir);

      if (!fs.existsSync(resolvedConfigDir)) return;

      // Watch config directory for changes
      server.watcher.add(resolvedConfigDir);
      server.watcher.on('change', (filePath: string) => {
        if (!filePath.startsWith(resolvedConfigDir)) return;
        const ext = path.extname(filePath);
        if (!['.ts', '.js', '.mjs', '.json'].includes(ext)) return;

        // Invalidate the virtual module
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: 'full-reload' });
      });
    },

    transformIndexHtml(html: string) {
      // Collect env vars matching the configured prefixes
      const envConfig: Record<string, string> = {};

      for (const [key, value] of Object.entries(process.env)) {
        if (value === undefined) continue;
        for (const prefix of envPrefixes) {
          if (key.startsWith(prefix)) {
            envConfig[key] = value;
            // Also add without prefix
            envConfig[key.slice(prefix.length)] = value;
            break;
          }
        }
      }

      if (Object.keys(envConfig).length === 0) return html;

      const script = `<script>window.__APP_CONFIG__=${JSON.stringify(envConfig)};</script>`;
      return html.replace('</head>', `${script}\n</head>`);
    },
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Scan a config directory and merge all config files into a single object.
 */
async function scanAndMergeConfigs(dir: string): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const extensions = ['.ts', '.js', '.mjs', '.json'];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = await scanAndMergeConfigs(path.join(dir, entry.name));
      result[entry.name] = nested;
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!extensions.includes(ext)) continue;

      const namespace = entry.name.replace(/\.(ts|js|mjs|json)$/, '').replace(/\.config$/, '');

      const filePath = path.join(dir, entry.name);

      try {
        if (ext === '.json') {
          const content = fs.readFileSync(filePath, 'utf-8');
          result[namespace] = JSON.parse(content);
        } else {
          const module = await import(filePath);
          const exported = module.default ?? module;
          result[namespace] = typeof exported === 'function' ? exported() : exported;
        }
      } catch {
        // Skip files that fail to load at build time
      }
    }
  }

  return result;
}

/**
 * Generate TypeScript declarations for the virtual config module.
 */
function generateDeclarations(config: Record<string, unknown>, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const typeStr = generateTypeFromValue(config, 0);
  const content = `// Auto-generated by @stackra/config/vite — do not edit manually
declare module 'virtual:stackra-config' {
  const config: ${typeStr};
  export default config;
}
`;

  fs.writeFileSync(outputPath, content, 'utf-8');
}

/**
 * Generate a TypeScript type string from a value.
 */
function generateTypeFromValue(value: unknown, depth: number): string {
  if (value === null || value === undefined) return 'unknown';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'unknown[]';

  if (typeof value === 'object') {
    const indent = '  '.repeat(depth + 1);
    const closingIndent = '  '.repeat(depth);
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => `${indent}${key}: ${generateTypeFromValue(val, depth + 1)};`)
      .join('\n');
    return `{\n${entries}\n${closingIndent}}`;
  }

  return 'unknown';
}
