/**
 * @file config.module.ts
 * @module @stackra/config/core
 * @description DI module for the configuration system.
 *   Registers ConfigManager, ConfigService, per-source tokens,
 *   and load factory providers as global singletons.
 *
 *   Two registration patterns:
 *   - `forRoot(options)` — root module sets up sources, drivers, sensitive keys
 *   - `forFeature(configs)` — feature modules register their namespaced configs
 */

import { Module, type IDynamicModule } from '@stackra/ts-container';

import type {
  IConfigModuleOptions,
  IConfigModuleAsyncOptions,
  IConfigFactory,
} from '@stackra/contracts';
import {
  CONFIG_MANAGER,
  CONFIG_SERVICE,
  CONFIG_OPTIONS,
  CONFIG_SCHEMA_REGISTRY,
} from '@stackra/contracts';
import { ConfigManager, ConfigSchemaRegistry } from './services';

// ════════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Generate a DI token for a named config source.
 *
 * @param name - Source name (omit for default source token)
 * @returns A symbol token for the source
 */
export function getConfigSourceToken(name?: string): symbol {
  return Symbol.for(`ConfigSource:${name ?? 'default'}`);
}

// ════════════════════════════════════════════════════════════════════════════════
// Re-export options type for convenience
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Config DI module.
 *
 * Provides unified configuration access via ConfigManager and ConfigService.
 *
 * @example
 * ```typescript
 * // Root module — sets up the config system
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({
 *       default: 'env',
 *       sources: { env: { driver: 'env' } },
 *       sensitiveKeys: ['*_SECRET', '*_KEY'],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // Feature module — registers its config namespace
 * @Module({
 *   imports: [
 *     ConfigModule.forFeature([databaseConfig, cacheConfig]),
 *   ],
 * })
 * export class InfraModule {}
 * ```
 */
@Module({})
export class ConfigModule {
  /**
   * Register the config module globally with static configuration.
   *
   * Call once in the root AppModule. Sets up the ConfigManager,
   * drivers, per-source tokens, and schema registry.
   *
   * @param config - Config module options
   * @returns Dynamic module definition
   */
  public static forRoot(config: IConfigModuleOptions): IDynamicModule {
    const syncDrivers = ['env', 'memory', 'static'];
    const sources = config.sources ?? {};

    // Per-source tokens for sync sources
    const syncSources = Object.entries(sources)
      .filter(([, sourceConfig]) => syncDrivers.includes(sourceConfig.driver))
      .map(([name]) => name);

    const sourceProviders = syncSources.map((sourceName) => ({
      provide: getConfigSourceToken(sourceName),
      useFactory: (manager: ConfigManager) => manager.source(sourceName),
      inject: [CONFIG_MANAGER],
    }));

    const defaultSourceProvider = {
      provide: getConfigSourceToken(),
      useFactory: (manager: ConfigManager) => manager.source(),
      inject: [CONFIG_MANAGER],
    };

    const sourceTokens = [getConfigSourceToken(), ...syncSources.map(getConfigSourceToken)];

    // Load factory providers from forRoot config
    const loadFactories: IConfigFactory[] = (config.load ?? []) as IConfigFactory[];
    const { providers: namespaceProviders, tokens: namespaceTokens } =
      this.buildFactoryProviders(loadFactories);

    // Merge factory results into the default source's load config
    this.mergeFactoriesIntoSource(config, loadFactories);

    return {
      module: ConfigModule,
      global: true,
      providers: [
        { provide: CONFIG_OPTIONS, useValue: config },
        { provide: CONFIG_MANAGER, useClass: ConfigManager },
        { provide: CONFIG_SCHEMA_REGISTRY, useClass: ConfigSchemaRegistry },
        {
          provide: CONFIG_SERVICE,
          useFactory: (manager: ConfigManager) => manager.source(),
          inject: [CONFIG_MANAGER],
        },
        ConfigManager,
        ConfigSchemaRegistry,
        defaultSourceProvider,
        ...sourceProviders,
        ...namespaceProviders,
      ],
      exports: [
        CONFIG_MANAGER,
        CONFIG_SERVICE,
        CONFIG_OPTIONS,
        CONFIG_SCHEMA_REGISTRY,
        ConfigManager,
        ConfigSchemaRegistry,
        ...sourceTokens,
        ...namespaceTokens,
      ],
    };
  }

  /**
   * Register namespaced config factories from a feature module.
   *
   * Feature modules call this to register their config without touching
   * the root AppModule. Each factory's output is merged into the default
   * source under its namespace key, and a DI provider is registered at
   * `factory.KEY` for direct injection.
   *
   * @param configs - Array of config factories created via `defineConfig(namespace, fn)` or `registerAs(namespace, fn)`
   * @returns Dynamic module definition
   *
   * @example
   * ```typescript
   * // In a feature module:
   * import { databaseConfig } from './config/database.config';
   * import { cacheConfig } from './config/cache.config';
   *
   * @Module({
   *   imports: [
   *     ConfigModule.forFeature([databaseConfig, cacheConfig]),
   *   ],
   * })
   * export class InfraModule {}
   *
   * // In a service:
   * @Injectable()
   * class DbService {
   *   constructor(@Inject(databaseConfig.KEY) private dbConfig: DbConfig) {}
   * }
   * ```
   */
  public static forFeature(configs: IConfigFactory[]): IDynamicModule {
    const { providers: namespaceProviders, tokens: namespaceTokens } =
      this.buildFactoryProviders(configs);

    // Register each factory's output with the ConfigManager on init
    const registrationProviders = configs.map((factory, idx) => ({
      provide: Symbol.for(`CONFIG_FEATURE_REG:${factory.namespace}:${idx}`),
      useFactory: (manager: ConfigManager, _registry: ConfigSchemaRegistry) => {
        // Merge factory output into the default source
        const service = manager.source();
        const result = factory();
        if (result instanceof Promise) {
          // Async — merge when resolved
          result.then((resolved) => {
            service.set(factory.namespace, resolved);
          });
        } else {
          // Sync — merge immediately if not already present
          if (!service.has(factory.namespace)) {
            service.set(factory.namespace, result);
          }
        }
        return null;
      },
      inject: [CONFIG_MANAGER, CONFIG_SCHEMA_REGISTRY],
    }));

    return {
      module: ConfigModule,
      providers: [...namespaceProviders, ...registrationProviders],
      exports: [...namespaceTokens],
    };
  }

  /**
   * Register the config module with async configuration.
   *
   * @param asyncOptions - Async configuration options
   * @returns Dynamic module definition
   */
  public static forRootAsync(asyncOptions: IConfigModuleAsyncOptions): IDynamicModule {
    const configProvider = {
      provide: CONFIG_OPTIONS,
      useFactory: asyncOptions.useFactory!,
      inject: asyncOptions.inject ?? [],
    };

    return {
      module: ConfigModule,
      global: true,
      imports: [...((asyncOptions.imports ?? []) as any[])],
      providers: [
        configProvider,
        { provide: CONFIG_MANAGER, useClass: ConfigManager },
        { provide: CONFIG_SCHEMA_REGISTRY, useClass: ConfigSchemaRegistry },
        {
          provide: CONFIG_SERVICE,
          useFactory: (manager: ConfigManager) => manager.source(),
          inject: [CONFIG_MANAGER],
        },
        ConfigManager,
        ConfigSchemaRegistry,
      ],
      exports: [
        CONFIG_MANAGER,
        CONFIG_SERVICE,
        CONFIG_OPTIONS,
        CONFIG_SCHEMA_REGISTRY,
        ConfigManager,
        ConfigSchemaRegistry,
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Build DI providers for config factories.
   */
  private static buildFactoryProviders(factories: IConfigFactory[]): {
    providers: Array<{ provide: symbol; useFactory: (...args: any[]) => any; inject: any[] }>;
    tokens: symbol[];
  } {
    const providers = factories.map((factory) => ({
      provide: factory.KEY,
      useFactory: (manager: ConfigManager) => {
        const service = manager.source();
        return service.get(factory.namespace) ?? factory();
      },
      inject: [CONFIG_MANAGER] as any[],
    }));

    const tokens = factories.map((f) => f.KEY);
    return { providers, tokens };
  }

  /**
   * Merge factory results into the default source's load config.
   */
  private static mergeFactoriesIntoSource(
    config: IConfigModuleOptions,
    factories: IConfigFactory[]
  ): void {
    if (factories.length === 0) return;

    const sources = config.sources ?? {};
    const defaultSourceName = config.default ?? 'env';
    const defaultSource = sources[defaultSourceName];
    if (!defaultSource) return;

    const existingLoad =
      typeof defaultSource.load === 'object' && defaultSource.load !== null
        ? (defaultSource.load as Record<string, unknown>)
        : {};
    const mergedLoad: Record<string, unknown> = { ...existingLoad };

    for (const factory of factories) {
      const result = factory();
      if (result instanceof Promise) continue; // Async — skip for now
      mergedLoad[factory.namespace] = result;
    }

    defaultSource.load = mergedLoad;
  }
}
