import "reflect-metadata";

/**
 * Clears metadata from a target object, either selectively by key or completely.
 *
 * This function provides flexible metadata cleanup capabilities. When called with just a target,
 * it removes all metadata from that target. When called with a specific metadata key, it removes
 * only that particular metadata entry. This is useful for cleanup operations, cache invalidation,
 * or resetting object state.
 *
 * @param {any} [metadataKey] - Optional metadata key to remove. If provided, only this specific metadata is cleared.
 *                              If omitted, ALL metadata is cleared from the target.
 * @param {object} [target] - The target object from which to clear metadata. If omitted when metadataKey is provided,
 *                            the function will clear that specific metadata key from all objects (global clear).
 * @param {string | symbol} [propertyKey] - Optional property key if clearing metadata from a specific property rather than the object itself.
 *
 * @returns {void} This function does not return a value.
 *
 * @example
 * ```typescript
 * // Setup: Define some metadata
 * class UserService {}
 * defineMetadata('version', '1.0.0', UserService);
 * defineMetadata('author', 'John Doe', UserService);
 * defineMetadata('config', { debug: true }, UserService);
 *
 * // Clear all metadata from the target
 * clearMetadata(undefined, UserService);
 *
 * // Verify all metadata is gone
 * console.log(getMetadata('version', UserService)); // undefined
 * console.log(getMetadata('author', UserService)); // undefined
 * console.log(getMetadata('config', UserService)); // undefined
 * ```
 *
 * @example
 * ```typescript
 * // Clear specific metadata by key
 * class ApiService {}
 * defineMetadata('cache', { users: [], posts: [] }, ApiService);
 * defineMetadata('config', { timeout: 5000 }, ApiService);
 *
 * // Clear only the cache metadata
 * clearMetadata('cache', ApiService);
 *
 * // Verify selective clearing
 * console.log(getMetadata('cache', ApiService)); // undefined
 * console.log(getMetadata('config', ApiService)); // { timeout: 5000 }
 * ```
 *
 * @example
 * ```typescript
 * // Clear property-specific metadata
 * class RouteController {
 *   getUser() {}
 *   deleteUser() {}
 * }
 *
 * // Add metadata to methods
 * defineMetadata('auth', { required: true }, RouteController.prototype, 'getUser');
 * defineMetadata('auth', { required: true, admin: true }, RouteController.prototype, 'deleteUser');
 * defineMetadata('cache', { ttl: 300 }, RouteController.prototype, 'getUser');
 *
 * // Clear all metadata from specific method
 * clearMetadata(undefined, RouteController.prototype, 'getUser');
 *
 * // Clear specific metadata from specific method
 * clearMetadata('auth', RouteController.prototype, 'deleteUser');
 * ```
 *
 * @example
 * ```typescript
 * // Global cleanup (use with caution)
 * // Clear all instances of a specific metadata key across all objects
 * clearMetadata('temporary-cache'); // Removes 'temporary-cache' from all objects
 * ```
 *
 * @since 1.0.0
 * @see {@link defineMetadata} for setting metadata values
 * @see {@link hasMetadata} for checking metadata existence before clearing
 */
export function clearMetadata(
  metadataKey?: any,
  target?: object,
  propertyKey?: string | symbol,
): void {
  // Handle the case where no target is provided
  if (!target) {
    // If no target is provided, we can't proceed with clearing
    // This could be extended to support global clearing in the future
    return;
  }

  // Case 1: Clear specific metadata key from target
  if (metadataKey !== undefined) {
    // Remove only the specified metadata key
    // This is a surgical removal that leaves other metadata intact
    if (propertyKey !== undefined) {
      Reflect.deleteMetadata(metadataKey, target, propertyKey);
    } else {
      Reflect.deleteMetadata(metadataKey, target);
    }
    return;
  }

  // Case 2: Clear all metadata from target
  // Get all metadata keys associated with the target (and optionally property)
  const allMetadataKeys =
    propertyKey !== undefined
      ? Reflect.getMetadataKeys(target, propertyKey)
      : Reflect.getMetadataKeys(target);

  // Iterate through each key and delete its associated metadata
  // This ensures complete cleanup of all metadata entries
  allMetadataKeys.forEach((key) => {
    if (propertyKey !== undefined) {
      Reflect.deleteMetadata(key, target, propertyKey);
    } else {
      Reflect.deleteMetadata(key, target);
    }
  });
}
