/**
 * @file sdui-component-source-metadata.token.ts
 * @module @stackra/contracts/tokens
 * @description Metadata key used by the `@SduiComponentSource(...)`
 *   class decorator + the `ComponentSourceHydrator` loader.
 *
 *   Every class that ships as a hydration source for the composite
 *   SDUI `ComponentRegistry` carries this metadata key. The
 *   hydrator queries
 *   `DISCOVERY_SERVICE.getProvidersByMetadata(SDUI_COMPONENT_SOURCE_METADATA_KEY)`
 *   at `OnApplicationBootstrap`, resolves every match through
 *   `ModuleRef.get(...)`, sorts by the source's `priority` field
 *   ascending, and calls `.hydrate(composite)` per source.
 *
 *   Uniform naming with every other discovery consumer in the
 *   workspace (`stackra:dashboard:widget`, `stackra:cache:store`,
 *   `stackra:events:subscriber`, `stackra:routing:route`, …) — the
 *   key is `stackra:<pkg>:<artefact>` so a log grep resolves the
 *   owner at a glance.
 */

/**
 * Metadata key stamped by `@SduiComponentSource(...)` on every
 * class that hydrates entries into the composite `ComponentRegistry`.
 *
 * Uses a plain string (not `Symbol.for(...)`) to match the
 * workspace convention for discovery metadata keys — string keys
 * grep cleanly in logs and stay stable across module realms
 * without the `Symbol.for` global-registry step.
 */
export const SDUI_COMPONENT_SOURCE_METADATA_KEY =
  "stackra:sdui:component-source";
