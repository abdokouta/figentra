/**
 * @file translation-keys.constant.ts
 * @description Translation keys for @stackra/nestjs-orm error messages.
 *
 * These keys follow dot notation: `package.context.message_key`.
 * Actual translations are resolved by @stackra/nestjs-i18n at the application level.
 * If i18n is not available, the key itself serves as a fallback identifier.
 */

/**
 * Translation keys for @stackra/nestjs-orm error messages.
 */
export const ORM_TRANSLATIONS = {
  ENTITY_NOT_FOUND: 'orm.entity_not_found',
  NO_ENTITY_DECORATOR: 'orm.no_entity_decorator',
  SLUG_TAKEN: 'orm.slug_taken',
} as const;
