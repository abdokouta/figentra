import 'reflect-metadata';

/**
 * Checks if metadata exists for a given key directly on the target object, excluding the prototype chain.
 *
 * This function provides a way to test for metadata presence specifically on the target object itself,
 * without considering inherited metadata from parent classes or prototype objects. This is useful when
 * you need to distinguish between metadata defined directly on an object versus metadata inherited
 * from its prototype chain. This precise checking is valuable for metadata override detection and
 * ensuring metadata locality.
 *
 * @param {any} metadataKey - The metadata key to search for. Can be any value including strings, symbols, or objects.
 * @param {object} target - The target object to check for metadata. This can be a class constructor, instance, or any object.
 * @param {string | symbol} [propertyKey] - Optional property key if checking for metadata on a specific property rather than the object itself.
 *
 * @returns {boolean} Returns true if the metadata key exists directly on the target (not inherited), false otherwise.
 *
 * @example
 * ```typescript
 * // Define metadata on base and derived classes
 * @Reflect.metadata('version', '1.0.0')
 * class BaseService {}
 *
 * @Reflect.metadata('version', '2.0.0')
 * class UserService extends BaseService {}
 *
 * class PlainService extends BaseService {}
 *
 * // Check for own metadata (direct definition)
 * const baseHasOwnVersion = hasOwnMetadata('version', BaseService); // true
 * const userHasOwnVersion = hasOwnMetadata('version', UserService); // true (overridden)
 * const plainHasOwnVersion = hasOwnMetadata('version', PlainService); // false (only inherited)
 *
 * // Compare with hasMetadata (includes prototype chain)
 * const plainHasVersion = hasMetadata('version', PlainService); // true (inherited from BaseService)
 * ```
 *
 * @example
 * ```typescript
 * // Property-specific metadata ownership
 * class BaseController {
 *   @Reflect.metadata('route', '/base')
 *   handleRequest() {}
 * }
 *
 * class UserController extends BaseController {
 *   @Reflect.metadata('route', '/users') // Override the route
 *   handleRequest() {}
 * }
 *
 * class AdminController extends BaseController {
 *   // No metadata override - inherits from base
 *   handleRequest() {}
 * }
 *
 * // Check for direct metadata definition on methods
 * const baseHasOwnRoute = hasOwnMetadata('route', BaseController.prototype, 'handleRequest'); // true
 * const userHasOwnRoute = hasOwnMetadata('route', UserController.prototype, 'handleRequest'); // true (overridden)
 * const adminHasOwnRoute = hasOwnMetadata('route', AdminController.prototype, 'handleRequest'); // false (inherited only)
 * ```
 *
 * @example
 * ```typescript
 * // Detecting metadata customization patterns
 * class ConfigurableService {
 *   @Reflect.metadata('timeout', 5000) // Default timeout
 *   defaultMethod() {}
 *
 *   customMethod() {} // No default timeout
 * }
 *
 * // At runtime, add custom timeout to specific method
 * defineMetadata('timeout', 10000, ConfigurableService.prototype, 'customMethod');
 *
 * // Check which methods have their own timeout configuration
 * const methods = ['defaultMethod', 'customMethod'];
 * methods.forEach(method => {
 *   const hasCustomTimeout = hasOwnMetadata('timeout', ConfigurableService.prototype, method);
 *   if (hasCustomTimeout) {
 *     const timeout = getMetadata<number>('timeout', ConfigurableService.prototype, method);
 *     console.log(`${method} has custom timeout: ${timeout}ms`);
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Metadata inheritance vs customization analysis
 * function analyzeMetadata(target: object, propertyKey: string, metadataKey: string) {
 *   const hasOwn = hasOwnMetadata(metadataKey, target, propertyKey);
 *   const hasAny = hasMetadata(metadataKey, target, propertyKey);
 *
 *   if (hasOwn) {
 *     return 'defined directly';
 *   } else if (hasAny) {
 *     return 'inherited from prototype';
 *   } else {
 *     return 'not available';
 *   }
 * }
 *
 * const status = analyzeMetadata(UserController.prototype, 'handleRequest', 'route');
 * console.log('Route metadata status:', status);
 * ```
 *
 * @since 1.0.0
 * @see {@link hasMetadata} for checking metadata including the prototype chain
 * @see {@link getMetadata} for retrieving metadata values
 */
export function hasOwnMetadata(
  metadataKey: any,
  target: object,
  propertyKey?: string | symbol
): boolean {
  // Use Reflect.hasOwnMetadata to check for metadata existence only on the target itself
  // This method does NOT search through the prototype chain - only direct metadata is considered
  // Returns true only if the metadata key exists directly on the specified target, false otherwise
  if (propertyKey !== undefined) {
    return Reflect.hasOwnMetadata(metadataKey, target, propertyKey);
  } else {
    return Reflect.hasOwnMetadata(metadataKey, target);
  }
}
