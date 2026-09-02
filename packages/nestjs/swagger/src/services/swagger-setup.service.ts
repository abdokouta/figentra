import type { INestApplication } from "@nestjs/common";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { SwaggerModule } from "@nestjs/swagger";
import { SwaggerTheme } from "swagger-themes";

import { DEFAULT_SWAGGER_CSS, DEFAULT_SWAGGER_UI_OPTIONS } from "../constants";
import type { SwaggerConfig } from "../interfaces";
import { SWAGGER_CONFIG } from "../swagger.module";
import { validateSwaggerConfig } from "../utils";
import { SwaggerBuilderService } from "./swagger-builder.service";

/**
 * Service for setting up Swagger/OpenAPI documentation
 */
@Injectable()
export class SwaggerSetupService {
  private readonly logger = new Logger(SwaggerSetupService.name);

  constructor(
    @Inject(SWAGGER_CONFIG) private readonly config: SwaggerConfig,
    private readonly swaggerBuilder: SwaggerBuilderService,
  ) {}

  /**
   * Setup Swagger documentation for NestJS application
   *
   * @param app - NestJS application instance
   */
  setup(app: INestApplication): void {
    // Validate configuration for security issues
    validateSwaggerConfig(this.config, process.env.NODE_ENV);

    // Skip setup if disabled
    if (!this.config.enabled) {
      console.log("⚠️  Swagger documentation is disabled");
      return;
    }

    // Debug: Log configuration
    this.logger.debug("Swagger configuration loaded:");
    this.logger.debug(`Server URL: ${this.config.serverUrl}`);
    this.logger.debug(
      `Additional servers: ${JSON.stringify(this.config.additionalServers, null, 2)}`,
    );

    // Build the document configuration
    const documentConfig = this.swaggerBuilder.build(this.config);

    // Create the Swagger document
    const document = SwaggerModule.createDocument(app, documentConfig, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
      deepScanRoutes: true,
    });

    // Extract document URLs from nested structure
    const jsonDocumentUrl = this.config.documents.jsonDocumentUrl;
    const yamlDocumentUrl = this.config.documents.yamlDocumentUrl;

    // Extract branding options from nested structure
    const customSiteTitle =
      this.config.branding.customSiteTitle || this.config.title;
    const customFavIcon = this.config.branding.customFavIcon || "/favicon.ico";
    const logoUrl = this.config.branding.logoUrl;

    // Build custom CSS: theme CSS (inline) + custom CSS URL (separate)
    let customCss = DEFAULT_SWAGGER_CSS;
    let customCssUrl: string | undefined;

    // Apply theme CSS if specified (inline CSS)
    if (this.config.branding.theme) {
      const swaggerTheme = new SwaggerTheme();
      const themeCss = swaggerTheme.getBuffer(this.config.branding.theme);
      // Append theme CSS to default (don't replace)
      customCss =
        themeCss +
        "\n" +
        DEFAULT_SWAGGER_CSS +
        `
        /* Dark theme text fixes */
        .swagger-ui .info .title,
        .swagger-ui .info .description,
        .swagger-ui .info .description p,
        .swagger-ui .info .description h1,
        .swagger-ui .info .description h2,
        .swagger-ui .info .description h3,
        .swagger-ui .info .description h4,
        .swagger-ui .info .description li,
        .swagger-ui .info .description a,
        .swagger-ui .info .description strong,
        .swagger-ui .opblock-tag,
        .swagger-ui .opblock-tag a,
        .swagger-ui .opblock-tag small,
        .swagger-ui .filter .operation-filter-input,
        .swagger-ui label,
        .swagger-ui .model-title,
        .swagger-ui .model,
        .swagger-ui table thead tr th,
        .swagger-ui table thead tr td,
        .swagger-ui .parameter__name,
        .swagger-ui .parameter__type,
        .swagger-ui .response-col_status,
        .swagger-ui .response-col_description {
          color: #e2e8f0 !important;
        }
        .swagger-ui .info .description a {
          color: #63b3ed !important;
        }
        .swagger-ui .scheme-container {
          background: rgba(255,255,255,0.05) !important;
        }
      `;
    }

    // Add logo CSS if logoUrl is specified
    if (logoUrl) {
      customCss += `
        .topbar .link {
          content: url('${logoUrl}');
          width: auto;
          height: 40px;
        }
        .topbar .link img {
          content: url('${logoUrl}');
        }
      `;
    }

    // Set custom CSS URL if specified (will be loaded separately by Swagger UI)
    if (this.config.branding.customCssUrl) {
      customCssUrl = this.config.branding.customCssUrl;
    }

    // Build Swagger UI setup options
    const setupOptions: any = {
      swaggerOptions: DEFAULT_SWAGGER_UI_OPTIONS,
      customSiteTitle,
      customfavIcon: customFavIcon,
      customCss,
    };

    // Add custom CSS URL if specified (loaded separately from inline CSS)
    if (customCssUrl) {
      setupOptions.customCssUrl = customCssUrl;
    }

    // Add optional document URLs if configured
    if (jsonDocumentUrl) {
      setupOptions.jsonDocumentUrl = jsonDocumentUrl;
    }

    if (yamlDocumentUrl) {
      setupOptions.yamlDocumentUrl = yamlDocumentUrl;
    }

    // Setup Swagger UI
    SwaggerModule.setup(this.config.apiPath, app, document, setupOptions);

    console.log(
      `📚 Swagger documentation available at: /${this.config.apiPath}`,
    );

    if (jsonDocumentUrl) {
      console.log(`   📄 JSON specification: /${jsonDocumentUrl}`);
    }

    if (yamlDocumentUrl) {
      console.log(`   📄 YAML specification: /${yamlDocumentUrl}`);
    }
  }
}
