import type { Type } from "@/types";

/**
 * @function inheritPropertyInitializers
 * @description Inherits property initializers from a source class to a target object.
 * This copies the default values of properties from an instance of the source class
 * to the target object, but only for properties that are undefined in the target.
 *
 * @param target - The target object to inherit property initializers to
 * @param sourceClass - The source class to inherit property initializers from
 * @param isPropertyInherited - Optional function to determine if a property should be inherited
 *                             (defaults to inheriting all properties)
 *
 * @example
 * class UserDto {
 *   name: string = 'Default Name';
 *   isActive: boolean = true;
 * }
 *
 * const target = {};
 * inheritPropertyInitializers(target, UserDto);
 * // target is now { name: 'Default Name', isActive: true }
 */
export function inheritPropertyInitializers(
  target: Record<string, any>,
  sourceClass: Type<any>,
  isPropertyInherited = (key: string) => true,
) {
  try {
    // Create a temporary instance of the source class to get its property values
    const tempInstance = new sourceClass();

    // Get all property names from the temporary instance
    const propertyNames = Object.getOwnPropertyNames(tempInstance);

    // Filter and copy properties
    propertyNames
      // Only include properties that are defined in the source and undefined in the target
      .filter(
        (propertyName) =>
          typeof tempInstance[propertyName] !== "undefined" &&
          typeof target[propertyName] === "undefined",
      )
      // Only include properties that should be inherited according to the predicate
      .filter((propertyName) => isPropertyInherited(propertyName))
      // Copy each property from the source to the target
      .forEach((propertyName) => {
        target[propertyName] = tempInstance[propertyName];
      });
  } catch {
    // Ignore errors that might occur during instantiation or property copying
    // This allows the function to fail gracefully if the source class can't be instantiated
  }
}
