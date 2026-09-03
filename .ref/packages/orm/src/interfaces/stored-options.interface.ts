/**
 * @file stored-options.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description StoredOptions interface.
 */

/** Options for the @Stored() decorator. */
export interface StoredOptions {
  /** Where the data lives. */
  strategy: StorageStrategy;

  /**
   * Suffix for the generated table name.
   * - `table` strategy: generates `{entity}_{suffix}` (e.g. `post_translations`)
   * - `pivot` strategy: uses shared `entity_{suffix}` (e.g. `entity_translations`)
   * Required for `table` and `pivot` strategies.
   */
  suffix?: string;

  /**
   * Partition key — creates multiple rows per entity, one per partition value.
   * e.g. `partitionBy: 'locale'` → one row per locale in the satellite table.
   * Without this, the satellite is 1:1 with the entity.
   */
  partitionBy?: string;

  /**
   * Column type for `json` strategy. Default: 'json'.
   * Ignored for `table` and `pivot` strategies (those store as string/text).
   */
  type?: string;

  /** Whether the field is nullable. */
  nullable?: boolean;
}
