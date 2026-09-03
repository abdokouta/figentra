import 'reflect-metadata';

/**
 * Retrieves metadata value associated with a specific metadata key from the target object or its prototype chain.
 *
 * This function serves as a type-safe wrapper around Reflect.getMetadata, providing enhanced type inference
 * and consistent error handling. It searches through the entire prototype chain to find the requested metadata.
 *
 * @template T - The expected type of the metadata value. Defaults to 'any' if not specified.
 * @param {unknown} metadataKey - The unique key used to identify the metadata. Can be any value including strings, symbols, or objects.
 * @param {object} target - The target object from which to retrieve metadata. This can be a class constructor, instance, or any object.
 * @param {string | symbol} [propertyKey] - Optional property key if retrieving metadata from a specific property rather than the object itself.
 *
 * @returns {T | undefined} The metadata value cast to type T if found, otherwise undefined.
 *
 * @example
 * ```typescript
 * // Define metadata on a class
 * @Reflect.metadata('role', 'admin')
 * class User {}
 *
 * // Retrieve the metadata
 * const role = getMetadata<string>('role', User); // Returns: 'admin'
 * const missing = getMetadata('nonexistent', User); // Returns: undefined
 * ```
 *
 * @example
 * ```typescript
 * // Working with property metadata
 * class ApiController {
 *   @Reflect.metadata('route', '/users')
 *   getUsers() {}
 * }
 *
 * const route = getMetadata<string>('route', ApiController.prototype, 'getUsers'); // Returns: '/users'
 * ```
 *
 * @since 1.0.0
 * @see {@link https://github.com/rbuckton/reflect-metadata} for more information about reflect-metadata
 */
export function getMetadata<T = any>(
  metadataKey: unknown,
  target: object,
  propertyKey?: string | symbol
): T | undefined {
  // Use Reflect.getMetadata to retrieve metadata from the target or its prototype chain
  // The third parameter (propertyKey) is optional and used for property-specific metadata
  if (propertyKey !== undefined) {
    return Reflect.getMetadata(metadataKey, target, propertyKey);
  } else {
    return Reflect.getMetadata(metadataKey, target);
  }
}
