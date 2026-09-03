/**
 * @file index.ts
 * @module @stackra/settings/core/utils
 * @description Barrel for settings utilities.
 *   Framework defaults live in `config/settings.config.ts`
 *   (registerAs factory); services apply `??` fallbacks inline
 *   against `DEFAULT_SETTINGS_CONFIG` at read-time (per ADR-0063).
 */

export { resolveFieldDefaults } from "./resolve-field-defaults.util";
export { buildEndpointUri } from "./build-endpoint-uri.util";
export { parseSchemaPayload } from "./parse-schema.util";
