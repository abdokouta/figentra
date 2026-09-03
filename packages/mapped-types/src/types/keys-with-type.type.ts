/**
 * @type KeysWithType
 * @description Utility type that extracts keys from an object type T where the value type matches the specified Type.
 * It creates a mapped type that maps each key to itself if the value type extends the specified Type, or to never otherwise.
 * Then it uses keyof T to extract only the keys that weren't mapped to never.
 *
 * @template T The object type to extract keys from
 * @template Type The type to match against property values
 *
 * @example
 * interface Example {
 *   name: string;
 *   age: number;
 *   isActive: boolean;
 *   handler: Function;
 * }
 *
 * // Will be "handler"
 * type FunctionKeys = KeysWithType<Example, Function>;
 */
export type KeysWithType<T, Type> = {
  [K in keyof T]: T[K] extends Type ? K : never;
}[keyof T];
