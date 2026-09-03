/**
 * @file index.ts
 * @module @stackra/contracts/interfaces
 * @description Public API barrel for all cross-package protocol interfaces.
 */

export type { IDiscoveryService, IDiscoveryProvider } from "./discovery";
export type { ILoggerManager, ILogChannel, LogLevel } from "./logger";
export type { IEventEmitter } from "./events";
export type { IStorage, IStorageManager } from "./storage";
export type { OnModuleInit, OnApplicationBootstrap } from "./lifecycle";
