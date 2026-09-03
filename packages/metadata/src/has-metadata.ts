import "reflect-metadata";

/**
 * Checks if metadata exists for a given key on the target object or anywhere in its prototype chain.
 *
 * This function provides a way to test for metadata presence before attempting to retrieve it.
 * It searches through the entire prototype chain, making it useful for checking inherited metadata
 * from parent classes or prototype objects. This is particularly valuable in decorator patterns
 * and metadata-driven architectures where you need to verify metadata availability.
 *
 * @param {any} metadataKey - The metadata key to search for. Can be any value including strings, symbols, or objects.
 * @param {object} target - The target object to check for metadata. This can be a class constructor, instance, or any object.
 * @param {string | symbol} [propertyKey] - Optional property key if checking for metadata on a specific property rather than the object itself.
 *
 * @returns {boolean} Returns true if the metadata key exists on the target or its prototype chain, false otherwise.
 *
 * @example
 * ```typescript
 * // Define metadata on a base class
 * @Reflect.metadata('entity', true)
 * class BaseEntity {}
 *
 * class User extends BaseEntity {}
 *
 * // Check for metadata existence
 * const hasEntityMetadata = hasMetadata('entity', User); // true (inherited from BaseEntity)
 * const hasVersionMetadata = hasMetadata('version', User); // false (not defined)
 *
 * // Safe metadata retrieval based on existence check
 * if (hasMetadata('entity', User)) {
 *   const isEntity = getMetadata<boolean>('entity', User);
 *   console.log('This is an entity:', isEntity);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Checking property-specific metadata
 * class ValidationService {
 *   @Reflect.metadata('required', true)
 *   validateEmail(email: string) {}
 *
 *   validateOptional(value: string) {}
 * }
 *
 * // Check for validation metadata on methods
 * const emailRequiresValidation = hasMetadata('required', ValidationService.prototype, 'validateEmail'); // true
 * const optionalRequiresValidation = hasMetadata('required', ValidationService.prototype, 'validateOptional'); // false
 *
 * // Conditional processing based on metadata presence
 * const methods = ['validateEmail', 'validateOptional'];
 * methods.forEach(method => {
 *   if (hasMetadata('required', ValidationService.prototype, method)) {
 *     console.log(`${method} requires validation`);
 *   } else {
 *     console.log(`${method} is optional`);
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using with inheritance and method overriding
 * class BaseController {
 *   @Reflect.metadata('auth', { required: true })
 *   authenticate() {}
 * }
 *
 * class AdminController extends BaseController {
 *   // Override without metadata
 *   authenticate() {}
 * }
 *
 * // Check metadata inheritance
 * const baseHasAuth = hasMetadata('auth', BaseController.prototype, 'authenticate'); // true
 * const adminHasAuth = hasMetadata('auth', AdminController.prototype, 'authenticate'); // true (inherited)
 * ```
 *
 * @since 1.0.0
 * @see {@link hasOwnMetadata} for checking metadata only on the target itself (excluding prototype chain)
 * @see {@link getMetadata} for retrieving metadata values
 */
export function hasMetadata(
  metadataKey: any,
  target: object,
  propertyKey?: string | symbol,
): boolean {
  // Use Reflect.hasMetadata to check for metadata existence
  // This method searches through the entire prototype chain, including inherited metadata
  // Returns true if the metadata key exists anywhere in the chain, false otherwise
  if (propertyKey !== undefined) {
    return Reflect.hasMetadata(metadataKey, target, propertyKey);
  } else {
    return Reflect.hasMetadata(metadataKey, target);
  }
}
