/**
 * @file crud-service.interface.ts
 * @description Interface that all CRUD services implement.
 */

/**
 * Standard CRUD service interface.
 * Used by the auto-generated resolver to call service methods.
 */
export interface ICrudService<Entity> {
  findAll(filter?: any, sort?: any): Promise<Entity[]>;
  findById(id: string): Promise<Entity | null>;
  findByIdOrFail(id: string): Promise<Entity>;
  findByIds(ids: readonly string[]): Promise<(Entity | Error)[]>;
  findByForeignKey(field: string, ids: readonly string[]): Promise<Map<string, Entity[]>>;
  count(filter?: any): Promise<number>;
  paginateLengthAware(page: number, limit: number, filter?: any, sort?: any): Promise<any>;
  paginateSimple(page: number, limit: number, filter?: any, sort?: any): Promise<any>;
  paginateCursor(first: number, after?: string, filter?: any, sort?: any): Promise<any>;
  create(input: any, ctx?: any): Promise<Entity>;
  update(input: any, ctx?: any): Promise<Entity>;
  softDelete(id: string, ctx?: any): Promise<Entity>;
  restore(id: string, ctx?: any): Promise<Entity>;
  forceDelete(id: string): Promise<boolean>;
}
