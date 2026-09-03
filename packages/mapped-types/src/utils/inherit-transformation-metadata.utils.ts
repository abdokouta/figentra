import type { Type, TransformMetadataKey } from '@/types';

/**
 * @function inheritTransformationMetadata
 * @description Inherits transformation metadata from a parent class to a target class.
 * This allows the target class to have the same transformation rules as the parent class.
 * If class-transformer is not available, this function does nothing.
 *
 * @param parentClass - The class to inherit transformation metadata from
 * @param targetClass - The class to apply the inherited transformation metadata to
 * @param isPropertyInherited - Optional function to determine if a property should be inherited
 * @param stackDecorators - Whether to stack decorators or replace them (default: true)
 *
 * @example
 * class UserDto {
 *   @Expose()
 *   name: string;
 *
 *   @Exclude()
 *   password: string;
 * }
 *
 * class CreateUserDto {
 *   // This class will inherit the transformation metadata for the name and password properties
 * }
 *
 * inheritTransformationMetadata(UserDto, CreateUserDto);
 */
export function inheritTransformationMetadata(
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean,
  stackDecorators = true
) {
  // Check if class-transformer is available in the project
  if (!isClassTransformerAvailable()) {
    return;
  }

  try {
    // Define the metadata keys to inherit
    const transformMetadataKeys: TransformMetadataKey[] = [
      '_typeMetadatas',
      '_exposeMetadatas',
      '_excludeMetadatas',
      '_transformMetadatas',
    ];

    // Inherit each type of metadata
    transformMetadataKeys.forEach((key) =>
      inheritTransformerMetadata(
        key,
        parentClass,
        targetClass,
        isPropertyInherited,
        stackDecorators
      )
    );
  } catch (err: Error | any) {
    // Log errors that occur during the inheritance process
    console.error(
      `Transformer ("class-transformer") metadata cannot be inherited for "${parentClass.name}" class.`
    );

    console.error(err);
  }
}

/**
 * @function inheritTransformerMetadata
 * @description Helper function that inherits a specific type of transformation metadata
 * from a parent class to a target class.
 *
 * @param key - The metadata key to inherit
 * @param parentClass - The class to inherit metadata from
 * @param targetClass - The class to apply the inherited metadata to
 * @param isPropertyInherited - Optional function to determine if a property should be inherited
 * @param stackDecorators - Whether to stack decorators or replace them
 *
 * @internal
 */
function inheritTransformerMetadata(
  key: TransformMetadataKey,
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean,
  stackDecorators = true
) {
  let classTransformer: any;

  try {
    // Try to import class-transformer from the cjs path (for newer versions)
    /** "class-transformer" >= v0.3.x */
    classTransformer = require('class-transformer/cjs/storage');
  } catch {
    // Fall back to the older import path
    /** "class-transformer" <= v0.3.x */
    classTransformer = require('class-transformer/storage');
  }

  // Get the metadata storage from class-transformer
  const metadataStorage /*: typeof import('class-transformer/types/storage').defaultMetadataStorage */ =
    classTransformer.defaultMetadataStorage;

  // Traverse the prototype chain to inherit metadata from all parent classes
  while (parentClass && parentClass !== Object) {
    // Check if the parent class has metadata for the current key
    if (metadataStorage[key].has(parentClass)) {
      // Get the metadata map for the current key
      const metadataMap = metadataStorage[key] as Map<Function, Map<string, any>>;
      // Get the parent metadata
      const parentMetadata = metadataMap.get(parentClass);

      // Create target metadata entries by filtering and mapping parent metadata
      const targetMetadataEntries: Iterable<[string, any]> = Array.from(parentMetadata!.entries())
        // Only include properties that should be inherited
        .filter(([key]) => !isPropertyInherited || isPropertyInherited(key))
        // Map each entry to update the target reference
        .map(([key, metadata]) => {
          if (Array.isArray(metadata)) {
            // "_transformMetadatas" is an array of elements
            // Create a new array with updated target references
            const targetMetadata = metadata.map((item) => ({
              ...item,
              target: targetClass,
            }));
            return [key, targetMetadata];
          }
          // For non-array metadata, just update the target reference
          return [key, { ...metadata, target: targetClass }];
        });

      // If the target class already has metadata for this key
      if (metadataMap.has(targetClass)) {
        // Get the existing rules
        const existingRules = metadataMap.get(targetClass)!.entries();
        // Create a new map to merge the existing and new metadata
        const mergeMap = new Map<string, any[]>();

        // Merge the existing and new metadata
        [existingRules, targetMetadataEntries].forEach((entries) => {
          for (const [valueKey, value] of entries) {
            if (mergeMap.has(valueKey) && stackDecorators) {
              // If the key already exists and we're stacking decorators
              const parentValue = mergeMap.get(valueKey);

              if (Array.isArray(parentValue)) {
                // Merge parent and child arrays if the parent value is an array
                parentValue.push(...(Array.isArray(value) ? value : [value]));
              }
            } else {
              // Otherwise, just set the value
              mergeMap.set(valueKey, value);
            }
          }
        });

        // Update the metadata map with the merged map
        metadataMap.set(targetClass, mergeMap);
      } else {
        // If the target class doesn't have metadata for this key yet,
        // create a new map with the target metadata entries
        metadataMap.set(targetClass, new Map(targetMetadataEntries));
      }
    }

    // Move up the prototype chain
    parentClass = Object.getPrototypeOf(parentClass);
  }
}

/**
 * @function isClassTransformerAvailable
 * @description Checks if the class-transformer package is available in the project.
 * This is used to gracefully handle cases where class-transformer is not installed.
 *
 * @returns {boolean} True if class-transformer is available, false otherwise
 *
 * @internal
 */
function isClassTransformerAvailable() {
  try {
    // Attempt to require class-transformer
    require('class-transformer');
    return true;
  } catch {
    // Return false if class-transformer is not available
    return false;
  }
}
