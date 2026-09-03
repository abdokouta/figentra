/**
 * @file settings.module.ts
 * @module @stackra/settings/core
 * @description DI module for the settings system. ADR-0063
 *   canonical shape — one `forRoot(options?)` signature, no merge
 *   step. Consumer apps register the framework `settingsConfig`
 *   factory via `ConfigModule.forRoot({ load: [settingsConfig] })`
 *   for defaults; apps override via
 *   `mergeAs("settings", () => ({...}))`.
 *
 *   `forRoot(options?)` binds config + service + registry + manager
 *   + schema fetcher + broadcast listener. Options bind AS-IS via
 *   `useValue`; services apply inline `??` fallbacks against
 *   `DEFAULT_SETTINGS_CONFIG` when reading optional fields.
 *
 *   `forRootAsync(options)` mirrors the shape via async factory.
 *   `forFeature([Dto])` registers a client-declared DTO through
 *   an inline `@Injectable()` registrar class implementing
 *   `OnApplicationBootstrap` per ADR-0052.
 */

import { ConfigModule } from "@stackra/config";
import {
  Inject,
  Injectable,
  Module,
  type DynamicModule,
  type OnApplicationBootstrap,
  type Type,
} from "@stackra/container";
import {
  ConfigScope,
  IAsyncModuleOptions,
  SETTINGS_CONFIG,
  SETTINGS_MANAGER,
  SETTINGS_REGISTRY,
  SETTINGS_SERVICE,
  type ISettingsModuleOptions,
  type ISettingsRegistry,
} from "@stackra/contracts";
import { Arr } from "@stackra/support";

// Framework baseline factory — imported from the publishable
// template at the package root. `SettingsModule.forRoot()` self-
// registers this baseline via `ConfigModule.forFeature(...)` per
// ADR-0063 amendment so the app never needs to include it in its
// own `ConfigModule.forRoot({ load })` array.
import { settingsConfig } from "../../config/settings.config";

import { SettingsRegistry } from "./registries/settings.registry";
import {
  SettingsBroadcastListener,
  SettingsSchemaFetcher,
  SettingsService,
  SettingsStoreManager,
} from "./services";

/**
 * Settings DI module.
 *
 * @example
 * ```typescript
 * // DI-first (canonical):
 * import { ConfigModule } from "@stackra/config";
 * import { settingsConfig } from "@stackra/settings/config";
 * import { SettingsModule } from "@stackra/settings";
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [settingsConfig] }),
 *     SettingsModule.forRoot(),
 *     SettingsModule.forFeature([DisplaySettings, TerminalSettings]),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * ```typescript
 * // Static (legacy):
 * @Module({
 *   imports: [
 *     SettingsModule.forRoot({
 *       default: 'localStorage',
 *       api: { autoLoadSchema: true },
 *       broadcasting: { enabled: true },
 *     }),
 *     SettingsModule.forFeature([DisplaySettings, TerminalSettings]),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class SettingsModule {
  /**
   * Register the settings module globally with static configuration.
   *
   * @param options - Optional user config. Bound AS-IS via
   *   `useValue`. Services apply `??` fallbacks inline against
   *   `DEFAULT_SETTINGS_CONFIG` when reading optional fields.
   */
  public static forRoot(options: ISettingsModuleOptions = {}): DynamicModule {
    return {
      module: SettingsModule,
      global: true,
      imports: [
        // Framework baseline — self-registered per ADR-0063
        // amendment. The static `options` bind wins as a
        // LAST-registered `useValue` provider under `SETTINGS_CONFIG`
        // (see providers array below), but the baseline stays in
        // place so `ConfigService.get('settings')` + string-path
        // lookups still resolve.
        ConfigModule.forFeature(settingsConfig, { scope: ConfigScope.Baseline }),
      ],
      providers: [
        { provide: SETTINGS_CONFIG, useValue: options },

        SettingsRegistry,
        { provide: SETTINGS_REGISTRY, useExisting: SettingsRegistry },

        SettingsStoreManager,
        { provide: SETTINGS_MANAGER, useExisting: SettingsStoreManager },

        SettingsService,
        { provide: SETTINGS_SERVICE, useExisting: SettingsService },

        SettingsSchemaFetcher,
        SettingsBroadcastListener,
      ],
      exports: [
        SETTINGS_CONFIG,
        SETTINGS_REGISTRY,
        SettingsRegistry,
        SETTINGS_MANAGER,
        SettingsStoreManager,
        SETTINGS_SERVICE,
        SettingsService,
        SettingsSchemaFetcher,
      ],
    };
  }

  /**
   * Register with async configuration.
   */
  public static forRootAsync(options: IAsyncModuleOptions<ISettingsModuleOptions>): DynamicModule {
    return {
      module: SettingsModule,
      global: true,
      imports: [
        // Framework baseline — self-registered per ADR-0063
        // amendment. The async factory below binds `SETTINGS_CONFIG`
        // directly via `useFactory`, so the baseline serves the
        // string-path `ConfigService.get('settings')` lookup surface.
        ConfigModule.forFeature(settingsConfig, { scope: ConfigScope.Baseline }),
        ...(options.imports ?? []),
      ],
      providers: [
        {
          provide: SETTINGS_CONFIG,
          useFactory: async (...args: unknown[]) => options.useFactory(...args),
          inject: options.inject ?? [],
        },

        SettingsRegistry,
        { provide: SETTINGS_REGISTRY, useExisting: SettingsRegistry },

        SettingsStoreManager,
        { provide: SETTINGS_MANAGER, useExisting: SettingsStoreManager },

        SettingsService,
        { provide: SETTINGS_SERVICE, useExisting: SettingsService },

        SettingsSchemaFetcher,
        SettingsBroadcastListener,
      ],
      exports: [
        SETTINGS_CONFIG,
        SETTINGS_REGISTRY,
        SettingsRegistry,
        SETTINGS_MANAGER,
        SettingsStoreManager,
        SETTINGS_SERVICE,
        SettingsService,
        SettingsSchemaFetcher,
      ],
    };
  }

  /**
   * Register client-declared DTO classes decorated with
   * `@Setting()`. See ADR-0052 for the inline registrar-class
   * pattern.
   */
  public static forFeature(dtos: Type | Type[]): DynamicModule {
    const list = Arr.wrap(dtos);

    @Injectable()
    class SettingsFeatureRegistrar implements OnApplicationBootstrap {
      public constructor(@Inject(SETTINGS_REGISTRY) private readonly registry: ISettingsRegistry) {}

      public onApplicationBootstrap(): void {
        for (const dto of list) this.registry.registerClass(dto);
      }
    }

    return {
      module: SettingsModule,
      providers: [SettingsFeatureRegistrar],
      exports: [],
    };
  }
}
