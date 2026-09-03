import { Inject } from '@nestjs/common';

import { MAIL_OPTIONS } from '../constants';

/**
 * Inject Mail Options Decorator
 *
 * Decorator for injecting the mail configuration options into a class.
 *
 * This decorator is a convenience wrapper around NestJS's @Inject decorator,
 * providing a more semantic way to inject mail configuration. It uses the
 * MAIL_OPTIONS injection token to retrieve the configuration from the
 * NestJS dependency injection container.
 *
 * **Benefits**:
 * - Cleaner, more readable code
 * - Type-safe injection
 * - Consistent with other Nesvel decorators
 * - Better IDE autocomplete support
 *
 * Using this decorator is equivalent to using @Inject(MAIL_OPTIONS) but
 * provides better readability and makes the intent clearer.
 *
 * @returns A parameter decorator for dependency injection
 *
 * @example Basic usage in a custom mail service
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectMailOptions } from '@nesvel/nestjs-mail';
 * import type { IMailConfig } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class CustomMailService {
 *   constructor(
 *     @InjectMailOptions() private readonly config: IMailConfig
 *   ) {}
 *
 *   getSmtpHost(): string {
 *     return this.config.smtp?.host || 'localhost';
 *   }
 * }
 * ```
 *
 * @example Accessing mail configuration for monitoring
 * ```typescript
 * import { Injectable, Logger } from '@nestjs/common';
 * import { InjectMailOptions } from '@nesvel/nestjs-mail';
 * import type { IMailConfig } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class MailMonitoringService {
 *   private readonly logger = new Logger(MailMonitoringService.name);
 *
 *   constructor(
 *     @InjectMailOptions() private readonly config: IMailConfig
 *   ) {
 *     this.logConfiguration();
 *   }
 *
 *   private logConfiguration() {
 *     this.logger.log(`Mail provider: ${this.config.defaultProvider}`);
 *     this.logger.log(`SMTP host: ${this.config.smtp?.host}`);
 *     this.logger.log(`From address: ${this.config.from?.address}`);
 *   }
 * }
 * ```
 *
 * @example Dynamic template path resolution
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectMailOptions } from '@nesvel/nestjs-mail';
 * import type { IMailConfig } from '@nesvel/nestjs-mail';
 * import * as path from 'path';
 *
 * @Injectable()
 * export class TemplateResolver {
 *   constructor(
 *     @InjectMailOptions() private readonly config: IMailConfig
 *   ) {}
 *
 *   resolveTemplatePath(templateName: string): string {
 *     const baseDir = this.config.template?.dir || './templates';
 *     return path.join(baseDir, `${templateName}.tsx`);
 *   }
 *
 *   isTemplateConfigured(): boolean {
 *     return !!this.config.template?.dir;
 *   }
 * }
 * ```
 *
 * @example Multi-tenant configuration service
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectMailOptions } from '@nesvel/nestjs-mail';
 * import type { IMailConfig } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class TenantMailService {
 *   private tenantConfigs: Map<string, IMailConfig> = new Map();
 *
 *   constructor(
 *     @InjectMailOptions() private readonly defaultConfig: IMailConfig
 *   ) {}
 *
 *   getConfigForTenant(tenantId: string): IMailConfig {
 *     return this.tenantConfigs.get(tenantId) || this.defaultConfig;
 *   }
 *
 *   setTenantConfig(tenantId: string, config: Partial<IMailConfig>) {
 *     this.tenantConfigs.set(tenantId, {
 *       ...this.defaultConfig,
 *       ...config,
 *     });
 *   }
 * }
 * ```
 *
 * @example Configuration validation service
 * ```typescript
 * import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
 * import { InjectMailOptions } from '@nesvel/nestjs-mail';
 * import type { IMailConfig } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class MailConfigValidator implements OnModuleInit {
 *   private readonly logger = new Logger(MailConfigValidator.name);
 *
 *   constructor(
 *     @InjectMailOptions() private readonly config: IMailConfig
 *   ) {}
 *
 *   onModuleInit() {
 *     this.validateConfiguration();
 *   }
 *
 *   private validateConfiguration() {
 *     if (!this.config.from?.address) {
 *       this.logger.warn('No default "from" address configured');
 *     }
 *
 *     if (this.config.defaultProvider === 'smtp' && !this.config.smtp?.host) {
 *       this.logger.error('SMTP provider selected but no host configured');
 *     }
 *
 *     if (this.config.template?.dir) {
 *       this.logger.log(`Templates directory: ${this.config.template.dir}`);
 *     }
 *   }
 * }
 * ```
 *
 * @example Health check service
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectMailOptions } from '@nesvel/nestjs-mail';
 * import type { IMailConfig } from '@nesvel/nestjs-mail';
 * import {
 *   HealthIndicator,
 *   HealthIndicatorResult,
 *   HealthCheckError,
 * } from '@nestjs/terminus';
 *
 * @Injectable()
 * export class MailHealthIndicator extends HealthIndicator {
 *   constructor(
 *     @InjectMailOptions() private readonly config: IMailConfig
 *   ) {
 *     super();
 *   }
 *
 *   async isHealthy(key: string): Promise<HealthIndicatorResult> {
 *     const isConfigured = !!(
 *       this.config.smtp?.host || this.config.sendgrid?.apiKey
 *     );
 *
 *     if (isConfigured) {
 *       return this.getStatus(key, true, {
 *         provider: this.config.defaultProvider,
 *       });
 *     }
 *
 *     throw HealthCheckError.make(
 *       'Mail check failed',
 *       this.getStatus(key, false)
 *     );
 *   }
 * }
 * ```
 *
 * @author Nesvel
 * @since 1.0.0
 */
export function InjectMailOptions(): ParameterDecorator {
  return Inject(MAIL_OPTIONS);
}
