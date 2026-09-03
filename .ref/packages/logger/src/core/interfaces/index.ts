/**
 * @file index.ts
 * @module @stackra/logger/core/interfaces
 * @description Barrel export for internal logger interfaces.
 *   ILogEnricher and ILogFormatter are in @stackra/contracts (cross-package).
 *   Only ILogChannel, IChannelTap, and IDiscoveryAdapter remain here (internal to logger package).
 */

export type { ILogChannel } from './log-channel.interface';
export type { IChannelTap } from './channel-tap.interface';
export type { IDiscoveryAdapter, IDiscoveredProvider } from './discovery-adapter.interface';
