/**
 * @file index.ts
 * @module @stackra/contracts
 * @description Root public API barrel for `@stackra/contracts`.
 *
 *   This package is the shared vocabulary of the Stackra framework — every
 *   cross-package interface, DI token, enum, type alias, DTO, event map,
 *   zone identifier, constant, and framework primitive lives here.
 *
 *   Zero runtime implementation. Every symbol is either a TypeScript type
 *   (erased at build) or a lightweight runtime constant (Symbol tokens,
 *   enum values). The package has ZERO `dependencies` — consumers pair it
 *   with the concrete implementation packages they need.
 *
 *   Import path: `import { LOGGER_MANAGER, type ILoggerManager } from "@stackra/contracts";`
 *
 * @security No secrets, no side effects, no network calls.
 */

// ── DI framework primitives ─────────────────────────────────────────────
export type {
  Type,
  Provider,
  IClassProvider,
  IValueProvider,
  IFactoryProvider,
  IExistingProvider,
  DynamicModule,
  OnModuleInit,
  OnApplicationBootstrap,
} from "./primitives";

export { Scope } from "./primitives";

// ── DI injection tokens ─────────────────────────────────────────────────
export {
  LOGGER_MANAGER,
  EVENT_EMITTER,
  DISCOVERY_SERVICE,
  STORAGE_MANAGER,
  CACHE_MANAGER,
  HTTP_SERVICE,
} from "./tokens";

// ── Cross-package interfaces ────────────────────────────────────────────
export type {
  IDiscoveryService,
  IDiscoveryProvider,
  ILoggerManager,
  ILogChannel,
  IEventEmitter,
  IStorage,
  IStorageManager,
} from "./interfaces";

// ── Cross-package enums ─────────────────────────────────────────────────
export { LogLevel, HttpMethod, Sensitivity } from "./enums";

// ── Remaining barrels (populated as the workspace grows) ────────────────
// Types, DTOs, events, zones, constants, decorators — each re-exported
// when they gain their first member.
