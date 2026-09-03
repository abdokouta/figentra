/**
 * @file index.ts
 * @module @stackra/nestjs-swagger/decorators
 * @description Re-exports all `@nestjs/swagger` decorators for single-import convenience.
 *   Consumers import from `@stackra/nestjs-swagger` instead of `@nestjs/swagger` directly.
 */

export {
  // ── Operation Metadata ────────────────────────────────────────────────────
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiHeader,
  ApiConsumes,
  ApiProduces,
  ApiExtension,
  ApiTags,
  ApiExcludeEndpoint,
  ApiExcludeController,

  // ── Authentication ────────────────────────────────────────────────────────
  ApiBearerAuth,
  ApiSecurity,
  ApiBasicAuth,
  ApiOAuth2,
  ApiCookieAuth,

  // ── Response Decorators ───────────────────────────────────────────────────
  ApiOkResponse,
  ApiCreatedResponse,
  ApiAcceptedResponse,
  ApiNoContentResponse,
  ApiMovedPermanentlyResponse,
  ApiFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnprocessableEntityResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
  ApiBadGatewayResponse,
  ApiServiceUnavailableResponse,
  ApiGatewayTimeoutResponse,
  ApiDefaultResponse,
  ApiResponse,

  // ── Schema Decorators ─────────────────────────────────────────────────────
  ApiExtraModels,
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,

  // ── Type Composition ──────────────────────────────────────────────────────
  PartialType,
  PickType,
  OmitType,
  IntersectionType,

  // ── Utilities ─────────────────────────────────────────────────────────────
  DocumentBuilder,
  getSchemaPath,
} from '@nestjs/swagger';
