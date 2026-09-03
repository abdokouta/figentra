/**
 * @file index.ts
 * @module @stackra/ts-redis/scripts
 * @description Barrel export for the Lua script registry and definitions.
 */

export { ScriptRegistry } from './script-registry.service';
export {
  TAG_INVALIDATE_SCRIPT,
  TAG_INVALIDATE_SCRIPT_NAME,
  DURATION_ACQUIRE_SCRIPT,
  DURATION_ACQUIRE_SCRIPT_NAME,
} from './definitions';
