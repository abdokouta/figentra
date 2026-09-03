import "reflect-metadata";
import type { Type } from "@/types";

/**
 * @function inheritValidationMetadata
 * @description Inherits validation metadata from a parent class to a target class.
 * This allows the target class to have the same validation rules as the parent class.
 * If class-validator is not available, this function does nothing.
 *
 * @param parentClass - The class to inherit validation metadata from
 * @param targetClass - The class to apply the inherited validation metadata to
 * @param isPropertyInherited - Optional function to determine if a property should be inherited
 *
 * @returns {string[] | undefined} An array of property names that had validation metadata applied,
 *                                or undefined if class-validator is not available or an error occurred
 *
 * @example
 * class UserDto {
 *   @IsString()
 *   name: string;
 * }
 *
 * class CreateUserDto {
 *   // This class will inherit the validation metadata for the name property
 * }
 *
 * inheritValidationMetadata(UserDto, CreateUserDto);
 */
export function inheritValidationMetadata(
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean,
) {
  // Check if class-validator is available in the project
  if (!isClassValidatorAvailable()) {
    return;
  }

  try {
    // Import class-validator dynamically
    const classValidator: typeof import("class-validator") = require("class-validator");

    // Get the metadata storage from class-validator
    // This handles different versions of class-validator
    const metadataStorage: import("class-validator").MetadataStorage = (classValidator as any)
      .getMetadataStorage
      ? (classValidator as any).getMetadataStorage()
      : classValidator.getFromContainer(classValidator.MetadataStorage);

    // Arguments for getting target validation metadata
    const getTargetValidationMetadatasArgs = [parentClass, null!, false, false];

    // Get the validation metadata from the parent class
    const targetMetadata: ReturnType<typeof metadataStorage.getTargetValidationMetadatas> = (
      metadataStorage.getTargetValidationMetadatas as Function
    )(...getTargetValidationMetadatasArgs);

    // Filter and map the metadata to apply to the target class
    return (
      targetMetadata
        // Only include properties that should be inherited
        .filter(({ propertyName }) => !isPropertyInherited || isPropertyInherited(propertyName))
        .map((value) => {
          // Get the original type metadata
          const originalType = Reflect.getMetadata(
            "design:type",
            parentClass.prototype,
            value.propertyName,
          );

          // If the original type exists, define it on the target class
          if (originalType) {
            Reflect.defineMetadata(
              "design:type",
              originalType,
              targetClass.prototype,
              value.propertyName,
            );
          }

          // Add the validation metadata to the target class
          metadataStorage.addValidationMetadata({
            ...value,
            target: targetClass,
          });

          // Return the property name that was processed
          return value.propertyName;
        })
    );
  } catch (err: Error | any) {
    // Log errors that occur during the inheritance process
    console.error(
      `Validation ("class-validator") metadata cannot be inherited for "${parentClass.name}" class.`,
    );

    console.error(err);
  }
}

/**
 * @function isClassValidatorAvailable
 * @description Checks if the class-validator package is available in the project.
 * This is used to gracefully handle cases where class-validator is not installed.
 *
 * @returns {boolean} True if class-validator is available, false otherwise
 *
 * @internal
 */
function isClassValidatorAvailable() {
  try {
    // Attempt to require class-validator
    require("class-validator");
    return true;
  } catch {
    // Return false if class-validator is not available
    return false;
  }
}
