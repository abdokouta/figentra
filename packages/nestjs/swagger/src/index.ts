// Manual re-exports from @nestjs/swagger (excluding SwaggerModule)
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
  DocumentBuilder,
  getSchemaPath,
  PartialType,
  PickType,
  OmitType,
  IntersectionType,
} from "@nestjs/swagger";

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
} from "@nestjs/swagger";
export * from "./constants";
export * from "./enums";
export * from "./interfaces";
export * from "./services";
export * from "./swagger.module";
export * from "./utils";

// Re-export everything from nestjs-swagger-dto package
export * from "nestjs-swagger-dto";
