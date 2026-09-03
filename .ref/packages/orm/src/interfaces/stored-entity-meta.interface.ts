/**
 * @file stored-entity-meta.interface.ts
 * @description Entity-level metadata stored on the class constructor by @Entity().
 */

/**
 * Entity metadata stored via Reflect.defineMetadata.
 */
export interface StoredEntityMeta {
  /** Class name of the entity. */
  name: string;
  /** Database table name override. */
  tableName?: string;
  /** List of applied trait names. */
  traits: string[];
  /** Custom repository class factory. */
  repository?: () => any;
  /** Database connection name. */
  connection?: string;
}
