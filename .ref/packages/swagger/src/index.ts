/**
 * @file index.ts
 * @module @stackra/nestjs-swagger
 * @description Public API for the NestJS Swagger documentation module.
 *   Provides module registration, services, decorators, interceptors, and
 *   re-exports from `@nestjs/swagger` for single-import convenience.
 */

// ============================================================================
// Module
// ============================================================================

export { NestSwaggerModule } from './nest-swagger.module';

// ============================================================================
// Services
// ============================================================================

export { SwaggerBuilderService } from './services';
export { SwaggerSetupService } from './services';

// ============================================================================
// Interceptors
// ============================================================================

export { ApiResponseInterceptor } from './interceptors';
export type { IApiResponseEnvelope } from './interceptors';

// ============================================================================
// Decorators (re-exports from @nestjs/swagger)
// ============================================================================

export {
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
  ApiBearerAuth,
  ApiSecurity,
  ApiBasicAuth,
  ApiOAuth2,
  ApiCookieAuth,
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
  ApiExtraModels,
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  PickType,
  OmitType,
  IntersectionType,
  DocumentBuilder,
  getSchemaPath,
} from './decorators';

// ============================================================================
// Interfaces
// ============================================================================

export type {
  ISwaggerConfig,
  ISwaggerTag,
  ISwaggerServer,
  ISwaggerSecurity,
  ISwaggerJwtConfig,
  ISwaggerApiKeyConfig,
  ISwaggerOAuth2Config,
  ISwaggerBranding,
  ISwaggerUIOptions,
} from './interfaces';

// ============================================================================
// Types (from @nestjs/swagger)
// ============================================================================

export type {
  ApiOperationOptions,
  ApiParamOptions,
  ApiQueryOptions,
  ApiBodyOptions,
  ApiHeaderOptions,
  ApiResponseOptions,
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
} from './types';

// ============================================================================
// Constants
// ============================================================================

export {
  AUTH_SCHEMES,
  DEFAULT_AUTH_CONFIGS,
  DEFAULT_SWAGGER_CSS,
  DEFAULT_UI_OPTIONS,
  SWAGGER_CONFIG_TOKEN,
} from './constants';

// ============================================================================
// Utilities
// ============================================================================

export { defineConfig } from './utils';
