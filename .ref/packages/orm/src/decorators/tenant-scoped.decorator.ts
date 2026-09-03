/**
 * @file tenant-scoped.decorator.ts
 * @module @stackra/nestjs-orm/decorators
 * @description Legacy TenantScoped decorator.
 *   @deprecated Use @Scoped() from @stackra/scope instead.
 */

/**
 * Mark an entity as tenant-scoped (auto-filtered by tenant_id).
 *
 * @deprecated Use `@Scoped()` from `@stackra/scope` instead.
 *   This decorator is retained for backward compatibility only.
 *
 * @returns Class decorator
 */
export function TenantScoped(): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata?.('stackra:orm:tenant-scoped', true, target);
  };
}
