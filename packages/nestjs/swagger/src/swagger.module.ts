import { DynamicModule, Module } from "@nestjs/common";

import type { SwaggerConfig } from "./interfaces";
import { SwaggerBuilderService, SwaggerSetupService } from "./services";

/**
 * Injection token for Swagger configuration
 */
export const SWAGGER_CONFIG = "SWAGGER_CONFIG";

/**
 * Swagger/OpenAPI Documentation Module
 *
 * A production-ready NestJS module that provides comprehensive Swagger/OpenAPI documentation
 * capabilities for your API. This module encapsulates all the necessary services and
 * configurations needed to set up interactive API documentation with minimal effort.
 *
 * @module SwaggerModule
 *
 * ## Features
 * - **Modular Architecture**: Clean separation of concerns with dedicated services
 * - **Type-Safe Configuration**: Full TypeScript support with detailed interfaces
 * - **Production-Ready**: Environment-based configuration with sensible defaults
 * - **Authentication Support**: Built-in JWT Bearer and API Key authentication schemes
 * - **Customizable UI**: Custom themes, styling, and behavior options
 * - **Tag-Based Organization**: Group endpoints by tags for better documentation structure
 *
 * ## Module Structure
 * ```
 * SwaggerModule
 * ├── Providers
 * │   ├── SwaggerBuilderService  - Builds OpenAPI document configuration
 * │   └── SwaggerSetupService    - Sets up Swagger UI and documentation endpoint
 * └── Exports
 *     └── SwaggerSetupService    - Available for use in main.ts
 * ```
 *
 * ## Usage
 *
 * ### Step 1: Import the Module with Configuration
 * Add SwaggerModule to your application's imports array:
 *
 * ```typescript
 * // app.module.ts
 * import { Module } from '@nestjs/common';
 * import { SwaggerModule } from './modules/swagger';
 * import { swaggerConfig } from './config';
 *
 * @Module({
 *   imports: [SwaggerModule.forRoot(swaggerConfig)],
 *   // ... other configurations
 * })
 * export class AppModule {}
 * ```
 *
 * ### Step 2: Initialize in main.ts
 * Use SwaggerSetupService in your main.ts to initialize the documentation:
 *
 * ```typescript
 * // main.ts
 * import { NestFactory } from '@nestjs/core';
 * import { AppModule } from './app.module';
 * import { SwaggerSetupService } from './modules';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *
 *   // Get the Swagger setup service and initialize
 *   const swaggerSetup = app.get(SwaggerSetupService);
 *   swaggerSetup.setup(app);
 *
 *   await app.listen(3000);
 * }
 * bootstrap();
 * ```
 *
 * ### Step 3: Configure via Environment Variables
 * Create a configuration file or use environment variables:
 *
 * ```typescript
 * // config/swagger.config.ts
 * export const swaggerConfig = {
 *   title: process.env.SWAGGER_TITLE || 'My API',
 *   description: process.env.SWAGGER_DESCRIPTION || 'API Documentation',
 *   version: process.env.API_VERSION || '1.0.0',
 *   apiPath: process.env.SWAGGER_PATH || 'api/docs',
 *   enabled: process.env.SWAGGER_ENABLED !== 'false',
 *   serverUrl: process.env.API_URL || 'http://localhost:3000',
 *   tags: [
 *     { name: 'health', description: 'Health check endpoints' },
 *     { name: 'users', description: 'User management endpoints' }
 *   ]
 * };
 * ```
 *
 * ## Decorating Controllers and DTOs
 *
 * Use NestJS Swagger decorators to document your API:
 *
 * ```typescript
 * import { Controller, Get, Post, Body } from '@nestjs/common';
 * import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nesvel/nestjs-swagger';
 *
 * @ApiTags('users')
 * @Controller('users')
 * export class UsersController {
 *   @Get()
 *   @ApiOperation({ summary: 'Get all users' })
 *   @ApiResponse({ status: 200, description: 'List of users' })
 *   findAll() {
 *     // ...
 *   }
 *
 *   @Post()
 *   @ApiBearerAuth('JWT-auth')
 *   @ApiOperation({ summary: 'Create a new user' })
 *   @ApiResponse({ status: 201, description: 'User created successfully' })
 *   create(@Body() createUserDto: CreateUserDto) {
 *     // ...
 *   }
 * }
 * ```
 *
 * ## Accessing the Documentation
 *
 * Once configured, the Swagger UI will be available at:
 * ```
 * http://localhost:3000/api/docs
 * ```
 * (Or whatever path you configured in `apiPath`)
 *
 * ## Production Deployment
 *
 * In production environments, Swagger is typically disabled by default.
 * To enable it, set the appropriate environment variable:
 *
 * ```bash
 * NODE_ENV=production
 * SWAGGER_ENABLED=true  # Only if you want docs in production
 * ```
 *
 * **Security Note**: Consider implementing authentication/authorization
 * for the documentation endpoint in production environments to prevent
 * exposing your API structure to unauthorized users.
 *
 * ## Customization
 *
 * ### Custom Authentication Schemes
 * Edit `constants/auth-configs.constants.ts` to add or modify authentication schemes.
 *
 * ### Custom UI Styling
 * Modify `constants/css.constants.ts` to customize the Swagger UI appearance.
 *
 * ### Custom Tags
 * Update the `tags` array in your configuration to define your API's tag structure.
 *
 * @see {@link SwaggerBuilderService} - Service for building OpenAPI documents
 * @see {@link SwaggerSetupService} - Service for setting up Swagger UI
 * @see {@link SwaggerConfig} - Configuration interface
 * @see {@link https://docs.nestjs.com/openapi/introduction | NestJS OpenAPI Documentation}
 * @see {@link https://swagger.io/specification/ | OpenAPI Specification}
 *
 * @example Basic Setup
 * ```typescript
 * // app.module.ts
 * @Module({
 *   imports: [SwaggerModule.forRoot(swaggerConfig)]
 * })
 * export class AppModule {}
 *
 * // main.ts
 * const app = await NestFactory.create(AppModule);
 * const swaggerSetup = app.get(SwaggerSetupService);
 * swaggerSetup.setup(app);
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Module({})
export class SwaggerModule {
  /**
   * Create Swagger module with configuration
   *
   * @param config - Swagger configuration options
   * @returns Dynamic module
   */
  static forRoot(config: SwaggerConfig): DynamicModule {
    return {
      module: SwaggerModule,
      providers: [
        {
          provide: SWAGGER_CONFIG,
          useValue: config,
        },
        SwaggerBuilderService,
        SwaggerSetupService,
      ],
      exports: [SwaggerSetupService],
    };
  }
}
