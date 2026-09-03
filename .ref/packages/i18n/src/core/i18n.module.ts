/**
 * @file i18n.module.ts
 * @module @stackra/i18n/core
 * @description Core i18n DI module — wires the translation engine, locale
 *   orchestrator, and direction service. ADR-0063 canonical shape — one
 *   `forRoot(config?)` signature, no merge step. Consumer apps register
 *   the framework `i18nConfig` factory via
 *   `ConfigModule.forRoot({ load: [i18nConfig] })` for defaults; apps
 *   override via `mergeAs("i18n", () => ({...}))`.
 *
 *   ## Module hierarchy
 *
 *   ```
 *   I18nModule.forRoot(config)          ← core (platform-agnostic)
 *       │
 *       ├── WebI18nModule.forRoot(config)     ← binds DOM direction adapter
 *       └── NativeI18nModule.forRoot(config)  ← binds RN direction adapter
 *   ```
 *
 *   Locale persistence is delegated to `@stackra/storage`: set
 *   `storage: '<instance>'` on the config and the core module binds
 *   `StorageBackedLocaleAdapter` under `I18N_LOCALE_STORAGE`.
 *   When the field is omitted, no persistence is wired and the
 *   `I18nLocaleService`'s `@Optional() @Inject(I18N_LOCALE_STORAGE)`
 *   receives `undefined` — no-op semantics.
 *
 *   ## Config namespace
 *
 *   `I18N_CONFIG` is intentionally module-internal (only `I18nModule`
 *   provides it, only i18n services read it), mirroring `QUERY_CONFIG`
 *   and other module-config tokens. Framework defaults live in the
 *   `i18nConfig` factory at `config/i18n.config.ts`; services apply
 *   `??` fallbacks inline against `DEFAULT_I18N_CONFIG` for the static
 *   path where callers supply partial options.
 */

import {
  Inject,
  Injectable,
  Module,
  type DynamicModule,
  type OnApplicationBootstrap,
  type Provider,
} from "@stackra/container";
import {
  I18N_LOCALE_SERVICE,
  I18N_LOCALE_STORAGE,
  I18N_MANAGER,
  I18N_DIRECTION_SERVICE,
} from "@stackra/contracts";

import { StorageBackedLocaleAdapter } from "./adapters/storage-backed-locale.adapter";
import { I18N_CONFIG } from "./constants";
import type { II18nConfig, I18nFeatureOptions } from "./interfaces";
import { I18nManager } from "./services/i18n-manager.service";
import { I18nLocaleService } from "./services/i18n-locale.service";
import { DirectionService } from "./services/direction.service";

/**
 * Decide whether the caller opted into durable locale persistence.
 * `undefined` and `'memory'` both mean "no persistence".
 */
function needsStorageBacking(storage: II18nConfig["storage"]): boolean {
  return !!storage && storage !== "memory";
}

/**
 * Producer for the `I18N_LOCALE_STORAGE` provider — bound only when
 * the caller set `storage: '<instance>'` on the config. Otherwise
 * the token stays unbound and the locale service's `@Optional`
 * injection resolves to `undefined`.
 */
function localeStorageProvider(config: Partial<II18nConfig>): Provider[] {
  if (!needsStorageBacking(config.storage)) return [];
  return [
    { provide: I18N_LOCALE_STORAGE, useClass: StorageBackedLocaleAdapter },
  ];
}

/**
 * Core i18n DI module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     WebStorageModule.forRoot({
 *       default: 'localStorage',
 *       stores: { localStorage: { driver: 'localStorage' } },
 *     }),
 *     I18nModule.forRoot({
 *       defaultLocale: 'en',
 *       supportedLocales: ['en', 'ar'],
 *       loader: StaticLoader,
 *       loaderOptions: { translations: { en, ar } },
 *       storage: 'localStorage',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class I18nModule {
  /**
   * Register the i18n module globally.
   *
   * @param options - Partial configuration. Bound AS-IS via
   *   `useValue`. Services apply `??` fallbacks inline against
   *   `DEFAULT_I18N_CONFIG` when reading optional fields.
   * @returns Dynamic module definition.
   */
  public static forRoot(options: Partial<II18nConfig> = {}): DynamicModule {
    return {
      module: I18nModule,
      global: true,
      providers: [
        // Bind AS-IS. I18nManager + I18nLocaleService apply
        // `??` fallbacks inline against DEFAULT_I18N_CONFIG when
        // reading optional fields (ADR-0063).
        { provide: I18N_CONFIG, useValue: options as II18nConfig },

        DirectionService,
        { provide: I18N_DIRECTION_SERVICE, useExisting: DirectionService },

        I18nManager,
        { provide: I18N_MANAGER, useExisting: I18nManager },

        I18nLocaleService,
        { provide: I18N_LOCALE_SERVICE, useExisting: I18nLocaleService },

        // Storage-backed locale adapter — bound conditionally based
        // on `options.storage`. Omitted means no persistence.
        ...localeStorageProvider(options),
      ],
      exports: [
        I18N_CONFIG,
        I18N_MANAGER,
        I18N_LOCALE_SERVICE,
        I18N_DIRECTION_SERVICE,
        I18nManager,
        I18nLocaleService,
        DirectionService,
      ],
    };
  }

  /**
   * Register namespace-scoped translations for a lazy-loaded feature.
   *
   * Seeding runs through an inline `@Injectable()`
   * `I18nFeatureRegistrar` class implementing
   * `OnApplicationBootstrap` — the canonical shape per
   * `.kiro/steering/module-lifecycle.md` + ADR-0052. Each
   * `forFeature` call creates a fresh class object so multiple
   * feature contributions never collide (the container tracks
   * providers by class identity).
   *
   * @param options - Feature configuration (namespace + loader/translations).
   * @returns Dynamic module definition.
   */
  public static forFeature(options: I18nFeatureOptions): DynamicModule {
    /**
     * Per-feature registrar. Closes over the caller's namespace +
     * loader + translations. The `I18nManager` is already provided
     * by `forRoot`, so this registrar only injects it.
     */
    @Injectable()
    class I18nFeatureRegistrar implements OnApplicationBootstrap {
      public constructor(
        @Inject(I18N_MANAGER) private readonly manager: I18nManager,
      ) {}

      // Fires in phase 3 (OnApplicationBootstrap) per ADR-0052 —
      // every forFeature registrar targets a base module's manager
      // (cross-module coordination) and must run after every
      // module's OnModuleInit has settled. Closure-captured — no
      // ModuleRef.get(...) needed. See
      // `.kiro/steering/module-lifecycle.md` §"forFeature — always
      // via an @Injectable() registrar class".
      public async onApplicationBootstrap(): Promise<void> {
        const {
          namespace,
          loader: LoaderClass,
          loaderOptions,
          translations,
        } = options;

        if (translations) {
          this.manager.mergeTranslations(namespace, translations);
        }

        if (LoaderClass) {
          const loader = new LoaderClass(loaderOptions);
          await this.manager.loadNamespace(namespace, loader);
        }
      }
    }

    return {
      module: I18nModule,
      providers: [I18nFeatureRegistrar],
    };
  }
}
