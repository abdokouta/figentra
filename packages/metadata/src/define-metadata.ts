import 'reflect-metadata';

/**
 * Defines metadata by associating a key-value pair with a target object or its property.
 *
 * This function serves as a type-safe wrapper around Reflect.defineMetadata, providing a consistent
 * interface for setting metadata values. The metadata becomes part of the target's metadata store
 * and can be retrieved later using getMetadata or other metadata retrieval functions.
 *
 * @param {any} metadataKey - The unique key to associate with the metadata value. Can be any value including strings, symbols, or objects.
 * @param {any} metadataValue - The value to store as metadata. Can be any type including primitives, objects, functions, etc.
 * @param {object} target - The target object on which to define the metadata. This can be a class constructor, instance, or any object.
 * @param {string | symbol} [propertyKey] - Optional property key if defining metadata on a specific property rather than the object itself.
 *
 * @returns {void} This function does not return a value.
 *
 * @example
 * ```typescript
 * // Define metadata on a class
 * class UserService {}
 *
 * defineMetadata('version', '2.1.0', UserService);
 * defineMetadata('author', { name: 'John Doe', email: 'john@example.com' }, UserService);
 * defineMetadata(Symbol('internal'), { debug: true }, UserService);
 *
 * // Later retrieve the metadata
 * const version = getMetadata<string>('version', UserService); // '2.1.0'
 * ```
 *
 * @example
 * ```typescript
 * // Define metadata on a property
 * class ApiController {
 *   getUsers() {}
 *   createUser() {}
 * }
 *
 * // Add route metadata to methods
 * defineMetadata('route', { method: 'GET', path: '/users' }, ApiController.prototype, 'getUsers');
 * defineMetadata('route', { method: 'POST', path: '/users' }, ApiController.prototype, 'createUser');
 *
 * // Add validation metadata
 * defineMetadata('validate', { requireAuth: true }, ApiController.prototype, 'createUser');
 * ```
 *
 * @example
 * ```typescript
 * // Using with decorators
 * function Route(method: string, path: string) {
 *   return function(target: any, propertyKey: string) {
 *     defineMetadata('route', { method, path }, target, propertyKey);
 *   };
 * }
 *
 * class UserController {
 *   @Route('GET', '/users/:id')
 *   getUser() {}
 * }
 * ```
 *
 * @since 1.0.0
 * @see {@link getMetadata} for retrieving metadata values
 * @see {@link updateMetadata} for updating existing metadata
 */
export function defineMetadata(
  metadataKey: any,
  metadataValue: any,
  target: object,
  propertyKey?: string | symbol
): void {
  // Use Reflect.defineMetadata to store the key-value pair in the target's metadata store
  // The propertyKey parameter is optional - if provided, metadata is associated with that specific property
  // If omitted, metadata is associated with the target object itself
  if (propertyKey !== undefined) {
    Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);
  } else {
    Reflect.defineMetadata(metadataKey, metadataValue, target);
  }
}
