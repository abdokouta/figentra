import { getMetadata } from "./get-metadata";
import { defineMetadata } from "./define-metadata";
import { hasMetadata } from "./has-metadata";

/**
 * Updates existing metadata or creates new metadata using a callback function to transform the value.
 *
 * This function provides a safe and flexible way to modify metadata values. It retrieves the current
 * metadata value, applies a transformation function, and stores the result back. If no metadata exists
 * for the given key, it uses the provided default value as the starting point for the transformation.
 *
 * @template TMetadata - The type of the metadata value being updated.
 * @param {unknown} metadataKey - The unique key identifying the metadata to update.
 * @param {TMetadata} defaultMetadataValue - The default value to use if no metadata exists for the given key.
 * @param {(metadataValue: TMetadata) => TMetadata} callback - A function that receives the current metadata value and returns the updated value.
 * @param {object} target - The target object containing the metadata to update.
 * @param {string | symbol} [propertyKey] - Optional property key if updating metadata on a specific property rather than the object itself.
 *
 * @returns {void} This function does not return a value.
 *
 * @example
 * ```typescript
 * // Initialize a counter metadata
 * class EventEmitter {}
 * defineMetadata('listenerCount', 0, EventEmitter);
 *
 * // Increment the counter using updateMetadata
 * updateMetadata(
 *   'listenerCount',
 *   0, // default value if metadata doesn't exist
 *   (currentCount) => currentCount + 1, // increment by 1
 *   EventEmitter
 * );
 *
 * const count = getMetadata<number>('listenerCount', EventEmitter); // Returns: 1
 * ```
 *
 * @example
 * ```typescript
 * // Update complex metadata objects
 * interface UserPreferences {
 *   theme: string;
 *   notifications: boolean;
 *   language: string;
 * }
 *
 * class UserService {}
 *
 * // Initialize with default preferences
 * const defaultPrefs: UserPreferences = {
 *   theme: 'light',
 *   notifications: true,
 *   language: 'en'
 * };
 *
 * // Update specific preference
 * updateMetadata(
 *   'userPrefs',
 *   defaultPrefs,
 *   (prefs) => ({ ...prefs, theme: 'dark' }), // Change theme to dark
 *   UserService
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Property-specific metadata updates
 * class ValidationRules {
 *   validateEmail() {}
 * }
 *
 * // Add validation rule
 * updateMetadata(
 *   'rules',
 *   [], // default empty array
 *   (rules) => [...rules, { type: 'email', required: true }], // Add email validation
 *   ValidationRules.prototype,
 *   'validateEmail'
 * );
 * ```
 *
 * @since 1.0.0
 * @see {@link getMetadata} for retrieving metadata values
 * @see {@link defineMetadata} for setting metadata values directly
 */
export function updateMetadata<TMetadata>(
  metadataKey: unknown,
  defaultMetadataValue: TMetadata,
  callback: (metadataValue: TMetadata) => TMetadata,
  target: object,
  propertyKey?: string | symbol,
): void {
  // Check if metadata exists first, then retrieve its value or use the default
  // This ensures we distinguish between "no metadata" and "metadata exists but is null/undefined"
  const currentMetadataValue: TMetadata = hasMetadata(metadataKey, target, propertyKey)
    ? getMetadata<TMetadata>(metadataKey, target, propertyKey)!
    : defaultMetadataValue;

  // Apply the transformation callback to get the updated value
  // This allows for complex transformations while maintaining type safety
  const updatedMetadataValue: TMetadata = callback(currentMetadataValue);

  // Store the updated value back to the metadata store
  // This replaces any existing metadata or creates new metadata if none existed
  defineMetadata(metadataKey, updatedMetadataValue, target, propertyKey);
}
