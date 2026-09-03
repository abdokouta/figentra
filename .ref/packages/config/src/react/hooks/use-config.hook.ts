/**
 * @file use-config.hook.ts
 * @module @stackra/config/react/hooks
 * @description React hook for accessing a ConfigService via DI.
 */

import { useInject } from '@stackra/ts-container/react';
import { CONFIG_MANAGER } from '@stackra/contracts';
import type { ConfigManager } from '../../core/services/config-manager.service';
import type { ConfigService } from '../../core/services/config.service';

// ════════════════════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════════════════════

/**
 * React hook for accessing a ConfigService in components.
 *
 * Returns a ConfigService for the given source (or the default source).
 * Requires `ConfigModule.forRoot()` to be imported in the application.
 *
 * @param sourceName - Optional source name (uses default if omitted)
 * @returns ConfigService instance for reading configuration values
 *
 * @example
 * ```tsx
 * function AppSettings() {
 *   const config = useConfig();
 *   const apiUrl = config.getString('API_URL', 'http://localhost:3000');
 *   const debug = config.getBool('DEBUG', false);
 *
 *   return (
 *     <div>
 *       <p>API: {apiUrl}</p>
 *       <p>Debug: {String(debug)}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useConfig(sourceName?: string): ConfigService {
  const manager = useInject<ConfigManager>(CONFIG_MANAGER);
  return manager.source(sourceName);
}

/**
 * React hook for accessing the ConfigManager directly.
 *
 * @returns The ConfigManager instance
 */
export function useConfigManager(): ConfigManager {
  return useInject<ConfigManager>(CONFIG_MANAGER);
}
