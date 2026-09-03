/**
 * @file tokens.constant.ts
 * @description Defines dependency injection token prefixes and constants
 * used throughout the ORM module for provider registration.
 */

/**
 * Prefix for repository injection tokens.
 * Used by @InjectRepository() to create named DI tokens.
 */
export const REPOSITORY_TOKEN_PREFIX = 'ORM_REPOSITORY_';
