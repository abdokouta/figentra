/**
 * @interface Type
 * @description Represents a constructor type with a generic parameter.
 * This interface is used to define a type that can be instantiated with the 'new' keyword.
 * It extends the Function type and adds a constructor signature.
 *
 * @template T The type of the instance that will be created (defaults to any)
 *
 * @example
 * class MyClass {}
 * const myClassType: Type<MyClass> = MyClass;
 * const instance = new myClassType();
 */
export interface Type<T = any> extends Function {
  /**
   * Constructor signature that creates an instance of type T
   * @param args Any arguments that the constructor accepts
   * @returns An instance of type T
   */
  new (...args: any[]): T;
}
