/**
 * @file index.ts
 * @module @stackra/ts-pagination/nestjs/decorators
 * @description Barrel export for NestJS pagination decorators.
 */

export { Paginated, PAGINATED_METADATA_KEY, type IPaginatedOptions } from './paginated.decorator';
export { PaginationContext, Page, PerPage, CursorParam } from './pagination-params.decorator';
export { CursorPaginate, type ICursorParams } from './cursor-paginate.decorator';
