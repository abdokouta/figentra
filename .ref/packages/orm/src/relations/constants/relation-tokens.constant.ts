/**
 * @file relation-tokens.constant.ts
 * @description Metadata key for relation decorators (@HasMany, @BelongsTo, @ManyToMany).
 *
 * These decorators store relation metadata on the entity prototype using
 * reflect-metadata. The schema builder reads this metadata to wire up
 * MikroORM relationships on entity classes.
 */

/**
 * Symbol used as the reflect-metadata key for relation definitions.
 *
 * Stored on entity prototypes by `@HasMany`, `@BelongsTo`, and `@ManyToMany`
 * decorators. The schema builder reads this to populate MikroORM relations.
 */
export const RELATION_METADATA = Symbol('orm:relations');
