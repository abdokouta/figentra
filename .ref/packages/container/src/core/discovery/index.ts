/**
 * @file index.ts
 * @module @stackra/container/discovery
 * @description Discovery Barrel Export
 *
 *   Metadata scanning and provider discovery.
 */

export { DiscoveryService } from "@/core/discovery/discovery.service";
export { ContainerDiscoveryService } from "@/core/discovery/container-discovery.service";
export { DiscoveryModule } from "@/core/discovery/discovery.module";
export { DiscoverableMetaHostCollection } from "@/core/container/discoverable-meta-host-collection.registry";
export type { IDiscoverableDecorator } from "@/core/interfaces/discoverable-decorator.type";
export * from "@/core/discovery/constants";
export * from "@/core/discovery/utils";
