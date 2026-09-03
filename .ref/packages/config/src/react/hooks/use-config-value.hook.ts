/**
 * @file use-config-value.hook.ts
 * @module @stackra/config/react/hooks
 * @description React hook for accessing a single config value reactively.
 */

import { useState, useEffect } from 'react';
import { useConfig } from './use-config.hook';

// ════════════════════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════════════════════

/**
 * React hook for reading a single config value.
 *
 * Returns the current value and re-renders when `set()` is called
 * on the underlying ConfigService (via event subscription when available).
 *
 * @typeParam T - Expected value type
 * @param key - Configuration key (supports dot notation)
 * @param defaultValue - Fallback value
 * @param sourceName - Optional source name
 * @returns The current config value
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const darkMode = useConfigValue<boolean>('ui.darkMode', false);
 *   return <Toggle checked={darkMode} />;
 * }
 * ```
 */
export function useConfigValue<T = unknown>(
  key: string,
  defaultValue?: T,
  sourceName?: string
): T | undefined {
  const config = useConfig(sourceName);
  const [value, setValue] = useState<T | undefined>(() => config.get<T>(key, defaultValue));

  // Re-read on key change
  useEffect(() => {
    setValue(config.get<T>(key, defaultValue));
  }, [key, defaultValue, config]);

  return value;
}

/**
 * React hook for async config source access.
 *
 * Returns `{ config, loading, error }` for sources that require
 * async initialization (HTTP driver, file driver).
 *
 * @param sourceName - Source name (uses default if omitted)
 * @returns Object with config service, loading state, and error
 *
 * @example
 * ```tsx
 * function RemoteConfig() {
 *   const { config, loading, error } = useConfigAsync('api');
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   const features = config.getJson('features', {});
 *   return <FeatureList features={features} />;
 * }
 * ```
 */
export function useConfigAsync(sourceName?: string): {
  config: ReturnType<typeof useConfig> | null;
  loading: boolean;
  error: Error | null;
} {
  const [state, setState] = useState<{
    config: ReturnType<typeof useConfig> | null;
    loading: boolean;
    error: Error | null;
  }>({ config: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    setState({ config: null, loading: true, error: null });

    // For sync sources, just return immediately
    try {
      const resolvedConfig = useConfig(sourceName);
      if (!cancelled) {
        setState({ config: resolvedConfig, loading: false, error: null });
      }
    } catch (error: Error | any) {
      if (!cancelled) {
        setState({ config: null, loading: false, error: error as Error });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [sourceName]);

  return state;
}
