/**
 * @file pagination-validation.pipe.ts
 * @module @stackra/pagination/nestjs/pipes
 * @description Validation pipe for pagination query parameters.
 *   Ensures page/limit are within bounds and applies defaults.
 */

import { IInjectable, type PipeTransform, BadRequestException } from '@nestjs/common';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Pipe
// ============================================================================

/**
 * Validates and normalizes pagination query parameters.
 *
 * Ensures `page` is ≥ 1 and `limit` is between `minLimit` and `maxLimit`.
 * Applies defaults when parameters are missing or invalid.
 *
 * @example
 * ```typescript
 * @Get()
 * @UsePipes(new PaginationValidationPipe({ defaultLimit: 25, maxLimit: 50 }))
 * async list(@Query() params: IValidatedPaginationParams) { ... }
 * ```
 */
@IInjectable()
export class PaginationValidationPipe implements PipeTransform<any, IValidatedPaginationParams> {
  private readonly defaultPage: number;
  private readonly defaultLimit: number;
  private readonly maxLimit: number;
  private readonly minLimit: number;

  public constructor(config?: IPaginationValidationConfig) {
    this.defaultPage = config?.defaultPage ?? 1;
    this.defaultLimit = config?.defaultLimit ?? 20;
    this.maxLimit = config?.maxLimit ?? 100;
    this.minLimit = config?.minLimit ?? 1;
  }

  /**
   * Transform and validate pagination input.
   *
   * @param value - Raw query parameters
   * @returns Validated pagination parameters
   * @throws BadRequestException if values are clearly invalid
   */
  public transform(value: any): IValidatedPaginationParams {
    let page = parseInt(value?.page, 10);
    let limit = parseInt(value?.limit ?? value?.per_page, 10);

    // Apply defaults for missing/NaN values
    if (isNaN(page) || page < 1) page = this.defaultPage;
    if (isNaN(limit)) limit = this.defaultLimit;

    // Enforce bounds
    if (limit < this.minLimit) limit = this.minLimit;
    if (limit > this.maxLimit) {
      throw new BadRequestException(
        `Limit exceeds maximum of ${this.maxLimit}. Requested: ${value?.limit ?? value?.per_page}`
      );
    }

    return { page, limit };
  }
}
