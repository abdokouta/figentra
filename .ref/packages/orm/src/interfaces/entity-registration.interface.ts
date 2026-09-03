/**
 * @file entity-registration.interface.ts
 * @description Options for registering an entity with OrmModule.forFeature().
 */

import { IType } from '@nestjs/common';

/**
 * Registration options for a single entity in OrmModule.forFeature().
 *
 * @example Minimal (auto-generates service + resolver):
 * ```ts
 * { entity: Product, dto: { create: CreateProductInput, update: UpdateProductInput } }
 * ```
 *
 * @example With custom service (auto-generates resolver):
 * ```ts
 * { entity: Tenant, dto: { ... }, service: TenantService }
 * ```
 *
 * @example Full override:
 * ```ts
 * { entity: Tenant, dto: { ... }, service: TenantService, resolver: TenantResolver }
 * ```
 *
 * @example REST controller generation:
 * ```ts
 * { entity: Product, dto: { ... }, controller: { path: 'products' } }
 * ```
 *
 * @example Both GraphQL resolver and REST controller:
 * ```ts
 * { entity: Product, dto: { ... }, controller: { path: 'products' } }
 * // resolver auto-generated from dto, controller auto-generated from controller option
 * ```
 */
export interface EntityRegistration {
  /** The decorated entity class (must have @Entity() applied). */
  entity: IType<any>;

  /** DTO classes for CRUD operations. Required for auto-generating resolver. */
  dto?: EntityDtoOptions;

  /** Singular name for GraphQL operations (e.g., 'tenant'). Defaults to lowercase class name. */
  name?: string;

  /** Custom service class (optional — auto-generated if not provided). */
  service?: IType<any>;

  /** Custom resolver class (optional — auto-generated if dto is provided). */
  resolver?: IType<any>;

  /**
   * REST controller configuration. When provided, auto-generates a CRUD controller.
   *
   * - `true` — auto-generate with entity name as path (e.g., `Product` → `/products`)
   * - `ControllerRegistrationOptions` — custom path and action overrides
   * - Custom class — use as-is (must extend defineController result)
   */
  controller?: boolean | ControllerRegistrationOptions | IType<any>;
}

/**
 * Options for auto-generated REST controller registration.
 */
export interface ControllerRegistrationOptions {
  /** Base route path (e.g., 'products', 'admin/users'). */
  path: string;
  /** Actions to enable/disable. All enabled by default except `forceDelete`. */
  actions?: {
    list?: boolean;
    show?: boolean;
    create?: boolean;
    update?: boolean;
    delete?: boolean;
    restore?: boolean;
    forceDelete?: boolean;
  };
}
