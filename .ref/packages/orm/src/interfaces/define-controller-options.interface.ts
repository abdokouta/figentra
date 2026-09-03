/**
 * @file define-controller-options.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description DefineControllerOptions interface.
 */

/**
 * Configuration for the auto-generated CRUD controller.
 */
export interface DefineControllerOptions {
  /** The entity class. */
  entity: IType<any>;
  /** Base route path (e.g., 'products', 'admin/users'). */
  path: string;
  /** DTO classes for request validation. When provided, ValidationPipe is auto-applied. */
  dto?: {
    create?: IType<any>;
    update?: IType<any>;
  };
  /** Actions to enable. All enabled by default except `forceDelete`. */
  actions?: ControllerActions;
  /** Singular resource name for response messages and Swagger docs. Defaults to entity name. */
  resourceName?: string;
  /** Apply the ApiResponseInterceptor for consistent envelope formatting. Default: true. */
  useResponseInterceptor?: boolean;
}
