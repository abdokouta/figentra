/**
 * @file index.ts
 * @module @stackra/zones/testing
 * @description Public API for the testing subpath.
 *
 *   In-memory doubles + provider helpers for consumers who want to
 *   test their `<Host>Module.forFeature({ zones })` registrations
 *   OR their `<Zone>` render output without booting a real DI
 *   container.
 */

export { MockZoneRegistry } from "./mock-zone-registry";
