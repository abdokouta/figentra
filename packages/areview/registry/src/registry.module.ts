import { DynamicModule, Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { RegistryDiscoveryService } from './registry.discovery.js';
import { RegistryService } from './registry.service.js';
import { REGISTRY_OPTIONS, type RegistryFeature, type RegistryManifestExtras, type RegistryModuleOptions } from './registry.types.js';

/** Configures Registry discovery and manifest registration for a Nest application. */
@Global()
@Module({})
export class RegistryModule {
  static forRoot(options: RegistryModuleOptions): DynamicModule {
    return {
      module: RegistryModule,
      imports: [DiscoveryModule],
      providers: [
        { provide: REGISTRY_OPTIONS, useValue: options },
        RegistryService,
        RegistryDiscoveryService,
      ],
      exports: [RegistryService, RegistryDiscoveryService],
    };
  }

  static forManifest(extras: RegistryManifestExtras): DynamicModule {
    const token = Symbol('STACKRA_REGISTRY_MANIFEST_EXTRAS');
    return {
      module: RegistryModule,
      providers: [{
        provide: token,
        inject: [RegistryService],
        useFactory: (registry: RegistryService) => {
          registry.addManifestExtras(extras);
          return extras;
        },
      }],
    };
  }

  static forFeature(feature: RegistryFeature): DynamicModule {
    const token = Symbol(`STACKRA_REGISTRY_FEATURE_${feature.modules?.[0]?.key ?? 'feature'}`);
    return {
      module: RegistryModule,
      providers: [{
        provide: token,
        inject: [RegistryService],
        useFactory: (registry: RegistryService) => {
          registry.addFeature(feature);
          return feature;
        },
      }],
    };
  }
}
