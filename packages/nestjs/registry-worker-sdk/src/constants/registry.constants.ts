/**
 * @file registry.constants.ts
 * @description Dependency injection tokens and reflection metadata keys for @figentra/registry.
 */

/** DI injection token for Registry module configuration options. */
export const REGISTRY_MODULE_OPTIONS = Symbol.for("figentra:registry:module_options");

/** Legacy alias for DI options token. */
export const REGISTRY_OPTIONS = REGISTRY_MODULE_OPTIONS;

/** DI injection token for the HTTP Registry Client instance. */
export const REGISTRY_CLIENT = Symbol.for("figentra:registry:client");

/** DI injection token for feature-level manifest contributions. */
export const REGISTRY_FEATURES = Symbol.for("figentra:registry:features");

/** DI injection token for manifest extras. */
export const REGISTRY_MANIFEST_EXTRAS = Symbol.for("figentra:registry:manifest_extras");

/** Reflection metadata key for declarative discovery records on classes and methods. */
export const REGISTRY_DISCOVERY_METADATA = Symbol.for("figentra:registry:discovery");

/** Global reflection key for workflow discovery interoperability. */
export const FIGENTRA_WORKFLOW_METADATA = Symbol.for("figentra:workflow");

/** Global reflection key for event discovery interoperability. */
export const FIGENTRA_EVENT_METADATA = Symbol.for("figentra:event");
