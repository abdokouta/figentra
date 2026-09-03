/**
 * @file generated-schemas.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description IGeneratedSchemas interface.
 */

/**
 * Generated schema set for an entity.
 */
export interface IGeneratedSchemas<T extends z.ZodRawShape = z.ZodRawShape> {
  /** Full entity schema (all fields including id, timestamps). */
  base: ZodObject<T>;
  /** Create schema (excludes id, timestamps, computed fields). */
  create: ZodObject<any>;
  /** Update schema (same as create but all fields optional). */
  update: ZodObject<any>;
  /** Filter schema (all filterable fields, all optional). */
  filter: ZodObject<any>;
}
