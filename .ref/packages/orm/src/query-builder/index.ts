/**
 * @file index.ts
 * @module @stackra/nestjs-orm/query-builder
 * @description Barrel export for the query builder system.
 */

export { ScopeRegistry } from './scope-registry';
export type { IScopeDefinition } from './scope-registry';

export { FluentQueryBuilder } from './query-builder';
export type { IPaginatedResult } from './query-builder';
