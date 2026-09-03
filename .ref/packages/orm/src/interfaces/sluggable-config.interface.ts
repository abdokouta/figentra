/**
 * @file sluggable-config.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description ISluggableConfig interface.
 */

/**
 * Configuration for the @Sluggable() trait.
 */
export interface ISluggableConfig {
  /** Source field(s) to generate slug from. String or array of field names. */
  from: string | string[];
  /** Separator between words (default: '-'). */
  separator?: string;
  /** Whether the slug must be unique (appends -1, -2 on conflict). Default: true. */
  unique?: boolean;
  /** Whether to regenerate slug on update when source field changes. Default: false. */
  regenerateOnUpdate?: boolean;
  /** Field name for the slug column. Default: 'slug'. */
  field?: string;
  /** Max length for the slug. Default: 255. */
  maxLength?: number;
}
