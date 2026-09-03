/**
 * @file native-config.module.ts
 * @module @stackra/config/native
 * @description React Native config module wrapping the core ConfigModule
 *   and registering native-specific drivers (AsyncStorage, Expo Constants, bundled).
 */

import { Module, type IDynamicModule } from '@stackra/ts-container';

import type { IConfigModuleOptions, IConfigSourceOptions } from '@stackra/contracts';
import { ConfigModule } from '../core/config.module';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Native config module.
 *
 * Wraps the core `ConfigModule` and adds React Native-specific sources:
 * - `asyncStorage` driver — persists config to AsyncStorage
 * - `expoConstants` driver — reads from Expo Constants manifest
 * - `bundled` driver — reads from a JSON object bundled at build time
 *
 * @example
 * ```typescript
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * import Constants from 'expo-constants';
 * import bundledConfig from '../config/app.config.json';
 *
 * @Module({
 *   imports: [
 *     NativeConfigModule.forRoot({
 *       default: 'bundled',
 *       sources: {
 *         bundled: { driver: 'static' },
 *         preferences: { driver: 'asyncStorage' },
 *       },
 *       asyncStorage: AsyncStorage,
 *       expoConstants: Constants,
 *       bundledConfig,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NativeConfigModule {
  /**
   * Register the native config module with sources.
   *
   * Merges native-specific sources into the core config module options
   * and registers native driver providers.
   *
   * @param options - Native config module options
   * @returns Dynamic module definition
   */
  public static forRoot(options: INativeConfigModuleOptions): IDynamicModule {
    const { asyncStorage, expoConstants, bundledConfig, ...coreOptions } = options;

    // If bundledConfig is provided and a 'bundled' source exists,
    // set its config to the bundled data
    if (bundledConfig && coreOptions.sources?.['bundled']) {
      (coreOptions.sources['bundled'] as IConfigSourceOptions).config = bundledConfig;
    }

    return {
      module: NativeConfigModule,
      global: true,
      imports: [ConfigModule.forRoot(coreOptions)],
      providers: [],
      exports: [],
    };
  }
}
