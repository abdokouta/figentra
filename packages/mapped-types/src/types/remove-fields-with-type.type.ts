import { KeysWithType } from "./keys-with-type.type";

/**
 * @type RemoveFieldsWithType
 * @description Utility type that removes fields from a type T where the value type matches the specified Type.
 * It uses the Exclude utility type to remove keys that match the KeysWithType.
 *
 * @template T The object type to remove fields from
 * @template Type The type of fields to remove
 *
 * @example
 * interface Example {
 *   name: string;
 *   age: number;
 *   isActive: boolean;
 *   handler: Function;
 * }
 *
 * // Will be { name: string; age: number; isActive: boolean; }
 * type WithoutFunctions = RemoveFieldsWithType<Example, Function>;
 */
export type RemoveFieldsWithType<T, Type> = Exclude<T, KeysWithType<T, Type>>;
