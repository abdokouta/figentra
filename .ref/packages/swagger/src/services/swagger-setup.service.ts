/**
 * @file swagger-setup.service.ts
 * @module @stackra/nestjs-swagger/services
 * @description Mounts Swagger UI on the NestJS application.
 *   Called in `main.ts` after app creation to register the documentation endpoint.
 */

import type { INestApplication } from '@nestjs/common';
import { Inject, IInjectable, Logger } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';

import { DEFAULT_SWAGGER_CSS, DEFAULT_UI_OPTIONS, SWAGGER_CONFIG_TOKEN } from '../constants';
import type { ISwaggerConfig } from '../interfaces';
import { SwaggerBuilderService } from './swagger-builder.service';

// ============================================================================
// Service
// ============================================================================

/**
 * Sets up and mounts Swagger UI on the NestJS application instance.
 *
 * ## Usage
 * ```typescript
 * // main.ts
 * const app = await NestFactory.create(AppModule);
 * const swagger = app.get(SwaggerSetupService);
 * swagger.setup(app);
 * await app.listen(3000);
 * ```
 */
@IInjectable()
export class SwaggerSetupService {
  private readonly logger = new Logger(SwaggerSetupService.name);

  public constructor(
    @Inject(SWAGGER_CONFIG_TOKEN) private readonly config: ISwaggerConfig,
    private readonly builder: SwaggerBuilderService
  ) {}

  /**
   * Mount Swagger UI on the application.
   *
   * No-op when `config.enabled` is `false`.
   *
   * @param app - NestJS application instance.
   */
  public setup(app: INestApplication): void {
    if (!this.config.enabled) {
      this.logger.warn('Swagger documentation is disabled (enabled: false).');
      return;
    }

    this.validateProductionUsage();

    const documentConfig = this.builder.build();
    const document = SwaggerModule.createDocument(app, documentConfig, {
      operationIdFactory: this.config.operationIdFactory ?? ((_ctrl, method) => method),
      deepScanRoutes: this.config.deepScanRoutes ?? true,
      ignoreGlobalPrefix: this.config.ignoreGlobalPrefix ?? false,
    });

    const setupOptions = this.buildSetupOptions();

    SwaggerModule.setup(this.config.apiPath, app, document, setupOptions);

    this.logger.log(`Swagger UI available at: /${this.config.apiPath}`);

    if (this.config.jsonDocumentUrl) {
      this.logger.log(`OpenAPI JSON spec: /${this.config.jsonDocumentUrl}`);
    }
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * Build Swagger UI setup options from config.
   */
  private buildSetupOptions(): Record<string, any> {
    const ui = this.config.ui ?? {};
    const branding = this.config.branding ?? {};

    const swaggerOptions = {
      persistAuthorization: ui.persistAuthorization ?? DEFAULT_UI_OPTIONS.persistAuthorization,
      docExpansion: ui.docExpansion ?? DEFAULT_UI_OPTIONS.docExpansion,
      filter: ui.filter ?? DEFAULT_UI_OPTIONS.filter,
      showRequestDuration: ui.showRequestDuration ?? DEFAULT_UI_OPTIONS.showRequestDuration,
      syntaxHighlight: { theme: ui.syntaxTheme ?? 'monokai' },
      tryItOutEnabled: ui.tryItOutEnabled ?? DEFAULT_UI_OPTIONS.tryItOutEnabled,
      displayOperationId: ui.displayOperationId ?? false,
      deepLinking: ui.deepLinking ?? true,
    };

    let customCss = DEFAULT_SWAGGER_CSS;

    // Apply theme if specified (requires swagger-themes at runtime)
    if (branding.theme) {
      try {
        const { SwaggerTheme } = require('swagger-themes');
        const themeInstance = new SwaggerTheme();
        const themeCss = themeInstance.getBuffer(branding.theme);
        customCss = themeCss + '\n' + customCss;
      } catch {
        this.logger.warn(`Failed to load swagger theme "${branding.theme}". Using default.`);
      }
    }

    // Logo override CSS
    if (branding.logoUrl) {
      customCss += `
        .topbar .link { content: url('${branding.logoUrl}'); width: auto; height: 40px; }
        .topbar .link img { content: url('${branding.logoUrl}'); }
      `;
    }

    const options: Record<string, any> = {
      swaggerOptions,
      customCss,
      customSiteTitle: branding.customSiteTitle ?? `${this.config.title} — API Docs`,
      customfavIcon: branding.customFavIcon ?? '/favicon.ico',
    };

    if (branding.customCssUrl) options.customCssUrl = branding.customCssUrl;
    if (this.config.jsonDocumentUrl) options.jsonDocumentUrl = this.config.jsonDocumentUrl;
    if (this.config.yamlDocumentUrl) options.yamlDocumentUrl = this.config.yamlDocumentUrl;

    return options;
  }

  /**
   * Log security warnings when Swagger is enabled in production.
   */
  private validateProductionUsage(): void {
    const env = (process.env.NODE_ENV ?? 'development').toLowerCase();

    if (env === 'production') {
      this.logger.warn(
        'Swagger documentation is enabled in production. ' +
          'Consider disabling or adding authentication to the docs endpoint.'
      );
    }

    if (this.config.serverUrl?.includes('localhost') && env === 'production') {
      this.logger.warn(
        'Swagger serverUrl points to localhost in production. Update to your production URL.'
      );
    }
  }
}
