/**
 * @file enum-property.decorator.ts
 * @description Property decorator for enum fields.
 */

import { Field } from '@nestjs/graphql';
import { addProperty } from '../utils/add-property.util';
import { PropertyOptions } from '../interfaces/property-options.interface';

/**
 * @EnumProperty() — marks a field as an enum column + GraphQL enum field.
 *
 * @param enumFn - Factory function returning the enum object
 * @param options - Additional property options (default, nullable, etc.)
 *
 * @example
 * ```ts
 * @EnumProperty(() => TenantStatus, { default: TenantStatus.ACTIVE })
 * status!: TenantStatus;
 * ```
 */
export function EnumProperty(
  enumFn: () => object,
  options?: Omit<PropertyOptions, 'type' | 'enum'>
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const key = String(propertyKey);

    addProperty(target, {
      key,
      type: 'enum',
      enum: enumFn,
      nullable: options?.nullable,
      defaultValue: options?.default,
    });

    const enumObj = enumFn();
    Field(() => enumObj as any, { nullable: options?.nullable ?? false })(target, propertyKey);
  };
}
