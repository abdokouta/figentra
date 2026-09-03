/**
 * @file tokens.constant.ts
 * @module @stackra/logger/core/constants
 * @description Internal DI tokens for the logger package.
 *   These tokens are used within the logger module only — they are NOT
 *   published to @stackra/contracts because no external package needs them.
 */

/**
 * DI token for the discovery adapter used by the ReporterLoader.
 *
 * In the core module, this is bound to `ContainerDiscoveryAdapter`.
 * In the NestJS module, this is overridden with `NestDiscoveryAdapter`.
 */
export const DISCOVERY_ADAPTER = Symbol.for('stackra:logger:discovery-adapter');
