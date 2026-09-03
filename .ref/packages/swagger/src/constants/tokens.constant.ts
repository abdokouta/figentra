/**
 * @file tokens.constant.ts
 * @module @stackra/nestjs-swagger/constants
 * @description DI tokens for the Swagger module.
 */

/** DI injection token for resolved Swagger configuration. */
export const SWAGGER_CONFIG_TOKEN = Symbol.for('SWAGGER_CONFIG');
