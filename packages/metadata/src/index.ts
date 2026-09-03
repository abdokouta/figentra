import { getMetadata } from "./get-metadata";
import { hasMetadata } from "./has-metadata";
import { clearMetadata } from "./clear-metadata";
import { updateMetadata } from "./update-metadata";
import { defineMetadata } from "./define-metadata";
import { getAllMetadata } from "./get-all-metadata";
import { hasOwnMetadata } from "./has-own-metadata";

/**
 * Core metadata utilities export.
 *
 * This module exports all essential functions for metadata management, providing a comprehensive
 * toolkit for TypeScript applications that rely on metadata-driven patterns and architectures.
 *
 * Functions are organized by their primary purpose:
 *
 * **Retrieval Functions:**
 * - `getMetadata` - Retrieve single metadata values with type safety
 * - `getAllMetadata` - Batch retrieve multiple metadata values efficiently
 *
 * **Definition Functions:**
 * - `defineMetadata` - Define new metadata key-value pairs
 * - `updateMetadata` - Update existing metadata using transformation callbacks
 *
 * **Management Functions:**
 * - `clearMetadata` - Remove metadata selectively or completely
 *
 * **Validation Functions:**
 * - `hasMetadata` - Check metadata existence (including prototype chain)
 * - `hasOwnMetadata` - Check metadata existence (direct only, excluding inheritance)
 *
 * @example
 * ```typescript
 * // Import specific functions as needed
 * import { defineMetadata, getMetadata } from '@vivel/metadata';
 *
 * // Or import all functions
 * import * as metadata from '@vivel/metadata';
 * ```
 */
export {
  getMetadata, // Get single metadata value with prototype chain support
  getAllMetadata, // Get multiple metadata values in one efficient operation
  defineMetadata, // Set metadata key-value pairs on targets
  updateMetadata, // Update existing metadata using callback transformations
  clearMetadata, // Remove metadata selectively or completely
  hasMetadata, // Check if metadata exists (includes prototype chain)
  hasOwnMetadata, // Check if metadata exists directly on target (no inheritance)
};
