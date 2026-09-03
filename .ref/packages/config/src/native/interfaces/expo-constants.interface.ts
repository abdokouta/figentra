/**
 * @file expo-constants.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IExpoConstants interface.
 */

/**
 * Expo Constants interface (matches expo-constants).
 */
export interface IExpoConstants {
  expoConfig?: {
    extra?: Record<string, unknown>;
    [key: string]: unknown;
  };
  manifest?: Record<string, unknown>;
}
