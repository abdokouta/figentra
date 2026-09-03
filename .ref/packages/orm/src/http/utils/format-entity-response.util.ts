/**
 * @file format-entity-response.util.ts
 * @module @stackra/nestjs-orm/http/utils
 * @description Formats a single entity into a standardized REST response.
 */

import { HttpStatus } from '@nestjs/common';
import type { EntityResponse } from '../types/response.type';

// ============================================================================
// Utility
// ============================================================================

/**
 * Format a single entity into the standard REST response envelope.
 *
 * @param entity - The entity instance.
 * @param statusCode - HTTP status code (default: 200).
 * @returns A standardized entity response.
 */
export function formatEntityResponse<T>(
  entity: T,
  statusCode: number = HttpStatus.OK
): EntityResponse<T> {
  return {
    data: entity,
    statusCode,
  };
}
