/**
 * @file discovery-options.type.ts
 * @module @stackra/container/core/interfaces
 * @description Options for `DiscoveryService.getProviders()`.
 */
export type DiscoveryOptions =
  { include?: Function[] } | { metadataKey?: string };
