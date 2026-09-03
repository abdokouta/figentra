/**
 * @file swagger-builder.service.ts
 * @module @stackra/nestjs-swagger/services
 * @description Builds the OpenAPI document specification from module configuration.
 *   Applies metadata, authentication schemes, servers, and tags to the DocumentBuilder.
 */

import { Inject, IInjectable } from '@nestjs/common';
import { DocumentBuilder } from '@nestjs/swagger';

import { AUTH_SCHEMES, DEFAULT_AUTH_CONFIGS, SWAGGER_CONFIG_TOKEN } from '../constants';
import type { ISwaggerConfig } from '../interfaces';

// ============================================================================
// Service
// ============================================================================

/**
 * Builds a fully configured OpenAPI document specification.
 *
 * Reads the module configuration and produces a `DocumentBuilder` result
 * suitable for `SwaggerModule.createDocument()`.
 */
@IInjectable()
export class SwaggerBuilderService {
  public constructor(@Inject(SWAGGER_CONFIG_TOKEN) private readonly config: ISwaggerConfig) {}

  /**
   * Build the OpenAPI document configuration.
   *
   * @returns The built OpenAPI document object.
   */
  public build(): ReturnType<DocumentBuilder['build']> {
    const builder = new DocumentBuilder()
      .setTitle(this.config.title)
      .setDescription(this.config.description)
      .setVersion(this.config.version);

    this.applyContact(builder);
    this.applyLicense(builder);
    this.applyServers(builder);
    this.applyAuthSchemes(builder);
    this.applyTags(builder);

    return builder.build();
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * Apply contact information to the document.
   */
  private applyContact(builder: DocumentBuilder): void {
    if (this.config.contactName || this.config.contactEmail) {
      builder.setContact(
        this.config.contactName ?? '',
        this.config.contactUrl ?? '',
        this.config.contactEmail ?? ''
      );
    }

    if (this.config.termsOfService) {
      builder.setTermsOfService(this.config.termsOfService);
    }
  }

  /**
   * Apply license information to the document.
   */
  private applyLicense(builder: DocumentBuilder): void {
    if (this.config.license) {
      builder.setLicense(this.config.license.name, this.config.license.url ?? '');
    }
  }

  /**
   * Apply server URLs for "Try it out" functionality.
   */
  private applyServers(builder: DocumentBuilder): void {
    const mainUrl = this.config.serverUrl || 'http://localhost:3000';
    builder.addServer(mainUrl, 'Current environment');

    if (this.config.additionalServers?.length) {
      for (const server of this.config.additionalServers) {
        builder.addServer(server.url, server.description);
      }
    }
  }

  /**
   * Apply authentication schemes to the document.
   */
  private applyAuthSchemes(builder: DocumentBuilder): void {
    const security = this.config.security;
    if (!security) return;

    // JWT Bearer
    if (security.jwt?.enabled) {
      builder.addBearerAuth(DEFAULT_AUTH_CONFIGS.JWT, security.jwt.name || AUTH_SCHEMES.JWT);
    }

    // API Key
    if (security.apiKey?.enabled) {
      builder.addApiKey(
        {
          ...DEFAULT_AUTH_CONFIGS.API_KEY,
          name: security.apiKey.headerName || 'X-API-KEY',
          description: security.apiKey.description,
        },
        security.apiKey.name || AUTH_SCHEMES.API_KEY
      );
    }

    // OAuth2
    if (security.oauth2?.enabled) {
      builder.addOAuth2(
        {
          type: 'oauth2',
          description: security.oauth2.description,
          flows: {
            authorizationCode: {
              authorizationUrl: security.oauth2.authorizationUrl,
              tokenUrl: security.oauth2.tokenUrl,
              scopes: security.oauth2.scopes,
            },
          },
        },
        security.oauth2.name || AUTH_SCHEMES.OAUTH2
      );
    }
  }

  /**
   * Apply API tags for operation grouping.
   */
  private applyTags(builder: DocumentBuilder): void {
    if (!this.config.tags?.length) return;

    for (const tag of this.config.tags) {
      builder.addTag(
        tag.name,
        tag.description,
        tag.externalDocsUrl ? { url: tag.externalDocsUrl } : undefined
      );
    }
  }
}
