import type { Type } from '@/types';

/**
 * @interface MappedType
 * @description Represents a mapped type that can be instantiated.
 * This interface extends the Type interface and adds a constructor signature
 * that takes no arguments. It's used to define types that are created by
 * mapping existing types to new types with modified properties.
 *
 * @template T The type that the mapped type represents
 *
 * @example
 * class UserDto {
 *   name: string;
 *   email: string;
 *   password: string;
 * }
 *
 * // CreateUserDto is a MappedType<UserDto>
 * const CreateUserDto = PickType(UserDto, ['name', 'email', 'password']);
 *
 * @publicApi
 */
export interface MappedType<T> extends Type<T> {
  /**
   * Constructor signature that creates an instance of type T with no arguments
   * @returns An instance of type T
   */
  new (): T;
}
