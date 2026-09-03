import 'reflect-metadata';

/**
 * Retrieves all metadata values for multiple keys from a target object, creating a comprehensive metadata map.
 *
 * This function efficiently collects metadata for multiple keys in a single operation, returning a typed object
 * containing all requested metadata values. It's particularly useful when you need to gather related metadata
 * in batch operations or when building metadata-driven applications.
 *
 * @template T - The expected shape of the returned metadata object. Should match the structure of keys and their expected values.
 * @param {(string | symbol)[]} metadataKeys - Array of metadata keys to retrieve. Each key will become a property in the returned object.
 * @param {object} target - The target object from which to retrieve metadata. This can be a class constructor, instance, or any object.
 * @param {string | symbol} [propertyKey] - Optional property key if retrieving metadata from a specific property rather than the object itself.
 *
 * @returns {T} An object containing all requested metadata values, with keys as property names and metadata values as property values.
 *               Missing metadata will have undefined values in the returned object.
 *
 * @example
 * ```typescript
 * // Define multiple metadata values
 * @Reflect.metadata('version', '1.0.0')
 * @Reflect.metadata('author', 'John Doe')
 * @Reflect.metadata('description', 'User management service')
 * class UserService {}
 *
 * // Retrieve all metadata at once
 * interface ServiceMetadata {
 *   version: string;
 *   author: string;
 *   description: string;
 *   license?: string; // Optional, may be undefined
 * }
 *
 * const metadata = getAllMetadata<ServiceMetadata>(
 *   ['version', 'author', 'description', 'license'],
 *   UserService
 * );
 * // Returns: { version: '1.0.0', author: 'John Doe', description: 'User management service', license: undefined }
 * ```
 *
 * @example
 * ```typescript
 * // Working with property metadata
 * class ApiController {
 *   @Reflect.metadata('method', 'GET')
 *   @Reflect.metadata('path', '/users')
 *   @Reflect.metadata('auth', true)
 *   getUsers() {}
 * }
 *
 * const routeMetadata = getAllMetadata<{ method: string; path: string; auth: boolean }>(
 *   ['method', 'path', 'auth'],
 *   ApiController.prototype,
 *   'getUsers'
 * );
 * // Returns: { method: 'GET', path: '/users', auth: true }
 * ```
 *
 * @since 1.0.0
 * @see {@link getMetadata} for retrieving single metadata values
 */
export function getAllMetadata<T extends Record<string | symbol, any>>(
  metadataKeys: (string | symbol)[],
  target: object,
  propertyKey?: string | symbol
): T {
  // Use reduce to build up an object containing all requested metadata
  // This approach is more efficient than multiple separate calls
  return metadataKeys.reduce(
    (accumulator, key) => {
      // Retrieve each metadata value and assign it to the accumulator object
      // The key serves as both the metadata key and the property name in the result
      if (propertyKey !== undefined) {
        accumulator[key] = Reflect.getMetadata(key, target, propertyKey);
      } else {
        accumulator[key] = Reflect.getMetadata(key, target);
      }
      return accumulator;
    },
    {} as Record<string | symbol, unknown>
  ) as T;
}
