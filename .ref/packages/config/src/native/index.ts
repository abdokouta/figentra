/**
 * @file index.ts
 * @module @stackra/config/native
 * @description Public API for the @stackra/config React Native adapter.
 *   Provides native-specific drivers (AsyncStorage, Expo Constants, bundled)
 *   and a NativeConfigModule wrapping the core ConfigModule.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { NativeConfigModule } from './native-config.module';
export type { INativeConfigModuleOptions } from './native-config.module';

// ════════════════════════════════════════════════════════════════════════════════
// Drivers
// ════════════════════════════════════════════════════════════════════════════════
export { AsyncStorageDriver } from './drivers';
export type { IAsyncStorageAdapter, IAsyncStorageDriverOptions } from './drivers';
export { ExpoConstantsDriver } from './drivers';
export type { IExpoConstants } from './drivers';
export { BundledConfigDriver } from './drivers';
