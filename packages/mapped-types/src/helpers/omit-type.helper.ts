import {
  inheritValidationMetadata,
  inheritPropertyInitializers,
  inheritTransformationMetadata,
} from '@/utils';
import type { MappedType } from '@/interfaces';
import type { Type, RemoveFieldsWithType } from '@/types';

/**
 * @function OmitType
 * @description Creates a new type by omitting a set of properties from an existing class.
 * The resulting type will have all properties except those specified in the keys array.
 * It also inherits validation and transformation metadata for the remaining properties.
 *
 * @param classRef - The class to omit properties from
 * @param keys - An array of property names to omit
 *
 * @returns A new class without the omitted properties
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
 * // UserResponseDto will have name and email properties, but not password
 * // with the same validation rules as UserDto
 * class UserResponseDto extends OmitType(UserDto, ['password']) {}
 *
 * @publicApi
 */
export function OmitType<T, K extends keyof T>(classRef: Type<T>, keys: readonly K[]) {
  // Create a predicate function to determine if a property should be inherited
  const isInheritedPredicate = (propertyKey: string) => !keys.includes(propertyKey as K);

  /**
   * Abstract class that will be returned as the omitted type
   * It inherits property initializers from the source class
   */
  abstract class OmitClassType {
    constructor() {
      // Inherit property initializers from the source class
      inheritPropertyInitializers(this, classRef, isInheritedPredicate);
    }
  }

  // Inherit validation metadata from the source class
  inheritValidationMetadata(classRef, OmitClassType, isInheritedPredicate);
  // Inherit transformation metadata from the source class
  inheritTransformationMetadata(classRef, OmitClassType, isInheritedPredicate);

  // Return the class as a MappedType
  // The type is an Omit of the original type, with Function fields removed
  return OmitClassType as MappedType<
    RemoveFieldsWithType<Omit<T, (typeof keys)[number]>, Function>
  >;
}
