import {
  applyIsOptionalDecorator,
  inheritValidationMetadata,
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  applyValidateIfDefinedDecorator,
} from '@/utils';
import type { MappedType } from '@/interfaces';
import type { Type, RemoveFieldsWithType } from '@/types';

/**
 * @function PartialType
 * @description Creates a new type by making all properties of an existing class optional.
 * The resulting type will have the same properties as the input class, but all will be optional.
 * It also inherits validation and transformation metadata, and applies IsOptional or ValidateIf
 * decorators to make validation rules respect the optional nature of the properties.
 *
 * @param classRef - The class to make properties optional for
 * @param options - Configuration options
 * @param options.skipNullProperties - If true, validations will be ignored for null or undefined values.
 *                                    If false, validations will be ignored only for undefined values.
 *                                    Defaults to true.
 *
 * @returns A new class with all properties made optional
 *
 * @example
 * class UserDto {
 *   @IsString()
 *   name: string;
 *
 *   @IsEmail()
 *   email: string;
 * }
 *
 * // UpdateUserDto will have optional name and email properties
 * // with the same validation rules as UserDto, but they'll only be
 * // applied if the properties are defined
 * class UpdateUserDto extends PartialType(UserDto) {}
 *
 * @publicApi
 */
export function PartialType<T>(
  classRef: Type<T>,
  /**
   *  Configuration options.
   */
  options: {
    /**
     * If true, validations will be ignored on a property if it is either null or undefined. If
     * false, validations will be ignored only if the property is undefined.
     * @default true
     */
    skipNullProperties?: boolean;
  } = {}
) {
  /**
   * Abstract class that will be returned as the partial type
   * It inherits property initializers from the source class
   */
  abstract class PartialClassType {
    constructor() {
      // Inherit property initializers from the source class
      inheritPropertyInitializers(this, classRef);
    }
  }

  // Inherit validation and transformation metadata from the source class
  const propertyKeys = inheritValidationMetadata(classRef, PartialClassType);
  inheritTransformationMetadata(classRef, PartialClassType);

  // Apply IsOptional or ValidateIf decorators to all properties with validation rules
  if (propertyKeys) {
    propertyKeys.forEach((key) => {
      if (options.skipNullProperties === false) {
        applyValidateIfDefinedDecorator(PartialClassType, key);
      } else {
        applyIsOptionalDecorator(PartialClassType, key);
      }
    });
  }

  // Set the name of the class to reflect that it's a partial version of the source class
  Object.defineProperty(PartialClassType, 'name', {
    value: `Partial${classRef.name}`,
  });

  // Return the class as a MappedType
  // The type is a Partial of the original type, with Function fields removed
  return PartialClassType as MappedType<RemoveFieldsWithType<Partial<T>, Function>>;
}
