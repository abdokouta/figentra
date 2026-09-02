/**
 * @file registry.module.ts
 * @description Dynamic NestJS module for @figentra/registry-worker-sdk.
 *
 * Provides root and feature configuration entry-points:
 * - **{@link RegistryModule.forRoot}** — synchronous configuration at application root.
 * - **{@link RegistryModule.forRootAsync}** — async configuration (supports useFactory / useClass / useExisting).
 * - **{@link RegistryModule.forFeature}** — contributes feature manifest slices from domain modules.
 */

import {
  DynamicModule,
  Global,
  Module,
  Provider,
} from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import type {
  RegistryModuleOptions,
  RegistryModuleAsyncOptions,
  RegistryOptionsFactory,
} from "./interfaces/registry-options.interface";
import type { RegistryFeature } from "./interfaces/registry-feature.interface";
import {
  REGISTRY_MODULE_OPTIONS,
  REGISTRY_FEATURES,
} from "./constants/registry.constants";
import { RegistryDiscoveryService } from "./services/registry-discovery.service";
import { RegistryClientService } from "./services/registry-client.service";
import { RegistryService } from "./services/registry.service";

/** Core providers registered by every RegistryModule root. */
const CORE_PROVIDERS: Provider[] = [
  RegistryDiscoveryService,
  RegistryClientService,
  RegistryService,
];

/** Exports made available to host application modules. */
const PUBLIC_EXPORTS = [RegistryService, RegistryClientService];

/**
 * Dynamic NestJS module for the Figentra Application Registry Worker SDK.
 */
@Global()
@Module({})
export class RegistryModule {
  /**
   * Registers RegistryModule with synchronous options at the application root.
   *
   * @param options - Module configuration options.
   */
  static forRoot(options: RegistryModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: REGISTRY_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      global: true,
      module: RegistryModule,
      imports: [DiscoveryModule],
      providers: [optionsProvider, ...CORE_PROVIDERS],
      exports: PUBLIC_EXPORTS,
    };
  }

  /**
   * Registers RegistryModule with async options (e.g. via ConfigService) at application root.
   *
   * @param asyncOptions - Async module configuration options.
   */
  static forRootAsync(asyncOptions: RegistryModuleAsyncOptions): DynamicModule {
    const asyncProviders = RegistryModule.createAsyncProviders(asyncOptions);

    return {
      global: true,
      module: RegistryModule,
      imports: [DiscoveryModule, ...(asyncOptions.imports ?? [])],
      providers: [...asyncProviders, ...CORE_PROVIDERS],
      exports: PUBLIC_EXPORTS,
    };
  }

  /**
   * Registers feature-level manifest contributions from a child NestJS module.
   *
   * @param feature - Manifest slices contributed by this feature module.
   */
  static forFeature(feature: RegistryFeature): DynamicModule {
    const featureProvider: Provider = {
      provide: REGISTRY_FEATURES,
      useValue: feature,
    };

    return {
      module: RegistryModule,
      providers: [featureProvider],
      exports: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers — async provider factory
  // ---------------------------------------------------------------------------

  private static createAsyncProviders(
    options: RegistryModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: REGISTRY_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ];
    }

    if (options.useClass) {
      return [
        {
          provide: REGISTRY_MODULE_OPTIONS,
          useFactory: async (factory: RegistryOptionsFactory) =>
            factory.createRegistryOptions(),
          inject: [options.useClass],
        },
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      ];
    }

    if (options.useExisting) {
      return [
        {
          provide: REGISTRY_MODULE_OPTIONS,
          useFactory: async (factory: RegistryOptionsFactory) =>
            factory.createRegistryOptions(),
          inject: [options.useExisting],
        },
      ];
    }

    throw new Error(
      "RegistryModule.forRootAsync() requires one of: useFactory, useClass, or useExisting.",
    );
  }
}
