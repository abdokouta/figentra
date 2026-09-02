/**
 * @file index.ts
 * @module @stackra/support/errors
 * @description Public barrel for the errors category — the base
 *   `StackraError` (extended by every framework error in the
 *   workspace) plus the two registry-specific errors that ship
 *   alongside `BaseRegistry`.
 */

export { StackraError } from "./stackra.error";
export type {
  IStackraErrorOptions,
  ISerializedStackraError,
} from "./stackra.error";
export { RegistryDuplicateError } from "./registry-duplicate.error";
export { RegistryMissingError } from "./registry-missing.error";
