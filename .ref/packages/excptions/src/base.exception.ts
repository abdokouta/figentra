/**
 * Base Exception Class
 *
 * Abstract base class for all custom exceptions in the Nesvel monorepo.
 * Extends the native JavaScript Error class and provides a consistent
 * interface with a static `make()` factory method for creating exception
 * instances with a clean, fluent API.
 *
 * This base class serves as the foundation for all domain-specific exceptions
 * and ensures consistency across the entire application. All custom exceptions
 * should extend this class to inherit the factory method pattern and standard
 * error handling behavior.
 *
 * Key Features:
 * - Static `make()` factory method for clean exception instantiation
 * - Proper stack trace preservation
 * - Type-safe constructor parameter passing
 * - Consistent error naming convention
 * - Full compatibility with native Error instances
 *
 * @abstract
 * @extends Error
 *
 * @example
 * ```typescript
 * // 1. Create a custom exception extending BaseException
 * export class UserNotFoundException extends BaseException {
 *   constructor(
 *     public readonly userId: number,
 *     message?: string
 *   ) {
 *     super(message || `User with ID ${userId} not found`);
 *     this.name = 'UserNotFoundException';
 *   }
 * }
 *
 * // 2. Use the make() method to create instances
 * // Instead of: UserNotFoundException.make(123)
 * throw UserNotFoundException.make(123);
 *
 * // With custom message
 * throw UserNotFoundException.make(123, 'User account has been deleted');
 *
 * // 3. More complex example with multiple parameters
 * export class ValidationException extends BaseException {
 *   constructor(
 *     public readonly field: string,
 *     public readonly value: any,
 *     public readonly constraint: string,
 *     message?: string
 *   ) {
 *     super(message || `Validation failed for ${field}: ${constraint}`);
 *     this.name = 'ValidationException';
 *   }
 * }
 *
 * // Using make() with multiple arguments
 * throw ValidationException.make('email', 'invalid@', 'must be valid email format');
 *
 * // 4. Works seamlessly in try-catch blocks
 * try {
 *   const user = await userService.find(userId);
 *   if (!user) {
 *     throw UserNotFoundException.make(userId);
 *   }
 * } catch (error: Error | any) {
 *   if (error instanceof UserNotFoundException) {
 *     console.log(`User ${error.userId} not found`);
 *   }
 * }
 * ```
 *
 * @author Nesvel Team
 * @since 1.0.0
 */
export abstract class BaseException extends Error {
  /**
   * Create a new exception instance (factory method)
   *
   * Static factory method that creates a new instance of the exception class
   * with a clean, fluent API. This method accepts any number of arguments
   * with any types and passes them directly to the constructor, making it
   * flexible enough to work with any custom exception implementation.
   *
   * The factory method provides several advantages:
   * - Cleaner, more readable exception creation syntax
   * - Consistent pattern across all exception types
   * - Better integration with functional programming patterns
   * - Easier to mock and test in unit tests
   * - Works with TypeScript's type inference
   *
   * @template T - The exception class type (inferred automatically)
   * @param args - Variable number of arguments to pass to the constructor
   * @returns A new instance of the exception class
   *
   * @example
   * ```typescript
   * // Simple exception with one argument
   * class NotFoundError extends BaseException {
   *   constructor(public resource: string) {
   *     super(`${resource} not found`);
   *     this.name = 'NotFoundError';
   *   }
   * }
   * throw NotFoundError.make('User');
   *
   * // Complex exception with multiple arguments
   * class ApiError extends BaseException {
   *   constructor(
   *     public statusCode: number,
   *     public endpoint: string,
   *     public method: string,
   *     message?: string
   *   ) {
   *     super(message || `API error ${statusCode} on ${method} ${endpoint}`);
   *     this.name = 'ApiError';
   *   }
   * }
   * throw ApiError.make(404, '/api/users/123', 'GET', 'User not found');
   *
   * // Exception with no arguments
   * class UnauthorizedError extends BaseException {
   *   constructor() {
   *     super('Unauthorized access');
   *     this.name = 'UnauthorizedError';
   *   }
   * }
   * throw UnauthorizedError.make();
   * ```
   *
   * @remarks
   * - This is the recommended way to create exception instances
   * - The method is type-safe and preserves all type information
   * - Works with any number and type of constructor arguments
   * - Automatically infers the correct return type
   * - Stack traces are properly preserved
   *
   * @see {@link BaseException} For the base exception class documentation
   * @since 1.0.0
   */
  static make<T extends BaseException>(this: new (...args: any[]) => T, ...args: any[]): T {
    // Create a new instance using the constructor with all provided arguments
    // 'this' refers to the actual exception class (e.g., UserNotFoundException)
    // The spread operator passes all arguments to the constructor
    return this.make(...args);
  }

  /**
   * Base Exception Constructor
   *
   * Initializes the base exception with a message. This constructor should
   * typically be called by child classes using super(message).
   *
   * @param message - The error message describing what went wrong
   *
   * @example
   * ```typescript
   * export class CustomException extends BaseException {
   *   constructor(public readonly code: string) {
   *     super(`Error occurred with code: ${code}`);
   *     this.name = 'CustomException';
   *   }
   * }
   * ```
   */
  constructor(message?: string) {
    // Call the parent Error constructor with the message
    super(message);

    // Set the exception name to the class name by default
    // Child classes can override this in their constructor
    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown
    // This is only available on V8 (Chrome, Node.js) but harmless on other engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
