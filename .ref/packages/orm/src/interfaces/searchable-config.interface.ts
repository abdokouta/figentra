/**
 * @file searchable-config.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description ISearchableConfig interface.
 */

/**
 * Configuration for the @Searchable() trait.
 */
export interface ISearchableConfig {
  /** Fields to include in the search index. */
  fields: string[];
  /** Relative weight per field (higher = more relevant). Default: 1 for all. */
  weights?: Record<string, number>;
  /** Whether to create a PostgreSQL GIN/GiST index. Default: false. */
  createIndex?: boolean;
  /** Custom analyzer (for Elasticsearch). Default: 'standard'. */
  analyzer?: string;
}
