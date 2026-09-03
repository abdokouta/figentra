/**
 * @file index.ts
 * @description Barrel export for entity relation decorators metadata.
 *
 * This module contains the metadata constants and option types used by
 * the `@HasMany`, `@BelongsTo`, and `@ManyToMany` decorators.
 *
 * For cross-module pivot relationships, use `@stackra/nestjs-link` instead.
 */

export { RELATION_METADATA } from './constants/relation-tokens.constant';
export type {
  HasManyOptions,
  BelongsToOptions,
  ManyToManyOptions,
  HasOneOptions,
  RelationPivotColumn,
  StoredRelation,
} from './interfaces/relation-options.interface';
