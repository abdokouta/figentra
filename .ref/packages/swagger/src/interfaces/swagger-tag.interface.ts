/**
 * @file swagger-tag.interface.ts
 * @module @stackra/nestjs-swagger/interfaces
 * @description Interface for API endpoint tag grouping.
 */

/**
 * Tag configuration for grouping API endpoints in Swagger UI.
 */
export interface ISwaggerTag {
  /** Tag name used in `@ApiTags()` decorator. */
  name: string;
  /** Human-readable description of the tag group. */
  description: string;
  /** Optional external documentation URL for this tag. */
  externalDocsUrl?: string;
}
