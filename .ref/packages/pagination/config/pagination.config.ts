/**
 * @file pagination.config.ts
 * @module @stackra/ts-pagination/config
 * @description Default pagination configuration preset built with IdefineConfig.
 *   Import and customize in your application module:
 *
 *   ```typescript
 *   import paginationConfig from '@stackra/ts-pagination/config';
 *
 *   NestPaginationModule.forRoot(paginationConfig);
 *   ```
 *
 *   Or override specific values:
 *
 *   ```typescript
 *   import { IdefineConfig } from '@stackra/ts-pagination';
 *
 *   export default IdefineConfig({
 *     defaultPerPage: 25,
 *     maxPerPage: 50,
 *   });
 *   ```
 */

import { IdefineConfig } from '../src/core/utils/define-config.util';

/**
 * Default pagination configuration.
 *
 * Provides sensible production defaults for pagination behavior.
 * Override individual values by passing a partial config to `IdefineConfig()`.
 */
export default IdefineConfig({
  /** Number of items returned per page when the client doesn't specify. */
  defaultPerPage: 15,

  /** Hard cap on items per page — prevents `?per_page=999999` abuse. */
  maxPerPage: 100,

  /** Query parameter name for the current page number (offset-based). */
  pageParam: 'page',

  /** Query parameter name for items per page. Supports both `per_page` and `perPage` in requests. */
  perPageParam: 'per_page',

  /** Query parameter name for the opaque cursor token (cursor-based). */
  cursorParam: 'cursor',
});
