/**
 * @file tokens.constant.ts
 * @module @stackra/pagination/core/constants
 * @description DI tokens for the pagination module.
 */

/** DI token for the pagination module configuration. */
export const PAGINATION_CONFIG = Symbol.for('PAGINATION_CONFIG');

/** DI token for the pagination link builder service. */
export const PAGINATION_LINK_BUILDER = Symbol.for('PAGINATION_LINK_BUILDER');
