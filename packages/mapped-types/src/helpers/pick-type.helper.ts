import {
  inheritValidationMetadata,
  inheritPropertyInitializers,
  inheritTransformationMetadata,
} from "@/utils";
import type { MappedType } from "@/interfaces";
import type { Type, RemoveFieldsWithType } from "@/types";

/**
 * @function PickType
 * @description Creates a new type by picking a set of properties from an existing class.
 * The resulting type will have only the properties specified in the keys array.
 * It also inherits validation and transformation metadata for the picked properties.
 *
 * @param classRef - The class to pick properties from
 * @param keys - An array of property names to pick
 *
 * @returns A new class with only the picked properties
 *
 * @example
 * class UserDto {
 *   @IsString()
 *   name: string;
 *
 *   @IsEmail()
 *   email: string;
 *
 *   @IsString()
 *   password: string;
 * }
 *
 * // CreateUserDto will have name, email, and password properties
 * // with the same validation rules as UserDto
 * class CreateUserDto extends PickType(UserDto, ['name', 'email', 'password']) {}
 *
 * @publicApi
 */
export function PickType<T, K extends keyof T>(classRef: Type<T>, keys: readonly K[]) {
  // Create a predicate function to determine if a property should be inherited
  const isInheritedPredicate = (propertyKey: string) => keys.includes(propertyKey as K);

  /**
   * Abstract class that will be returned as the picked type
   * It inherits property initializers from the source class
   */
  abstract class PickClassType {
    constructor() {
      // Inherit property initializers from the source class
      inheritPropertyInitializers(this, classRef, isInheritedPredicate);
    }
  }

  // Inherit validation metadata from the source class
  inheritValidationMetadata(classRef, PickClassType, isInheritedPredicate);
  // Inherit transformation metadata from the source class
  inheritTransformationMetadata(classRef, PickClassType, isInheritedPredicate);

  // Return the class as a MappedType
  // The type is a Pick of the original type, with Function fields removed
  return PickClassType as MappedType<
    RemoveFieldsWithType<Pick<T, (typeof keys)[number]>, Function>
  >;
}
