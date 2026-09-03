/**
 * @file defaults.constant.ts
 * @module @stackra/ts-pagination/core/constants
 * @description Default pagination configuration values.
 *   Single source of truth for all defaults — used by both
 *   `defineConfig()` and `PaginationModule.forRoot()`.
 */

import type { IPaginationModuleConfig } from '../pagination.module';

/**
 * Default pagination configuration.
 *
 * Applied when the consumer does not provide a value for a given field.
 * Used by `defineConfig()` and `PaginationModule.forRoot()` internally.
 */
export const DEFAULT_CONFIG: Required<IPaginationModuleConfig> = {
  /** 15 items per page when the client doesn't specify. */
  defaultPerPage: 15,

  /** Hard cap at 100 items per page — prevents abuse. */
  maxPerPage: 100,

  /** Standard query parameter for page number. */
  pageParam: 'page',

  /** Standard query parameter for per-page count. */
  perPageParam: 'per_page',

  /** Standard query parameter for cursor token. */
  cursorParam: 'cursor',
};
