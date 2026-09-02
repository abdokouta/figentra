import { Injectable, Logger } from "@nestjs/common";
import { DocumentBuilder } from "@nestjs/swagger";

import { AUTH_SCHEMES, DEFAULT_AUTH_CONFIGS } from "../constants";
import type { SwaggerConfig } from "../interfaces";

/**
 * Service for building Swagger/OpenAPI documentation configuration
 */
@Injectable()
export class SwaggerBuilderService {
  private readonly logger = new Logger(SwaggerBuilderService.name);

  /**
   * Build Swagger document configuration
   *
   * @param config - Swagger configuration object
   * @returns DocumentBuilder instance with all configurations applied
   */
  build(config: SwaggerConfig) {
    const builder = new DocumentBuilder()
      .setTitle(config.title)
      .setDescription(config.description)
      .setVersion(config.version);

    // Add contact information
    if (config.contactName || config.contactEmail) {
      builder.setContact(
        config.contactName || "",
        config.contactUrl || "",
        config.contactEmail || "",
      );
    }

    // Add terms of service
    if (config.termsOfService) {
      builder.setTermsOfService(config.termsOfService);
    }

    // Add license information
    if (config.license) {
      builder.setLicense(config.license.name, config.license.url);
    }

    // Add authentication schemes
    this.addAuthenticationSchemes(builder);

    // Add servers
    this.addServers(builder, config);

    // Add tags
    this.addTags(builder, config.tags);

    const document = builder.build();

    // Debug: Log server configuration
    this.logger.debug("Swagger servers configured:");
    this.logger.debug(JSON.stringify(document.servers, null, 2));

    return document;
  }

  /**
   * Add servers to the document builder
   *
   * @param builder - DocumentBuilder instance
   * @param config - Swagger configuration object
   */
  private addServers(builder: DocumentBuilder, config: SwaggerConfig): void {
    // Add main server
    const mainServerUrl = config.serverUrl || "http://localhost:3000";
    builder.addServer(mainServerUrl, "Current environment");

    this.logger.debug(`Added main server: ${mainServerUrl}`);

    // Add additional servers
    if (config.additionalServers && config.additionalServers.length > 0) {
      config.additionalServers.forEach((server) => {
        builder.addServer(server.url, server.description);
        this.logger.debug(
          `Added additional server: ${server.url} - ${server.description}`,
        );
      });
    }
  }

  /**
   * Add authentication schemes to the document builder
   *
   * @param builder - DocumentBuilder instance
   */
  private addAuthenticationSchemes(builder: DocumentBuilder): void {
    // JWT Bearer authentication
    builder.addBearerAuth(DEFAULT_AUTH_CONFIGS.JWT, AUTH_SCHEMES.JWT);

    // API Key authentication
    builder.addApiKey(DEFAULT_AUTH_CONFIGS.API_KEY, AUTH_SCHEMES.API_KEY);
  }

  /**
   * Add tags to the document builder
   *
   * @param builder - DocumentBuilder instance
   * @param tags - Array of tag configurations
   */
  private addTags(
    builder: DocumentBuilder,
    tags?: Array<{ name: string; description: string }>,
  ): void {
    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        builder.addTag(tag.name, tag.description);
      });
    }
  }
}
