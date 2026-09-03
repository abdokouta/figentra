/**
 * @file inject-i18n.decorator.ts
 * @module @stackra/i18n/nestjs/decorators
 * @description Convenience decorator to inject the I18nService.
 */

import { Inject } from '@nestjs/common';

/** DI token for the I18n service. */
const I18N_SERVICE = Symbol.for('I18N_SERVICE');

/**
 * Inject the I18n translation service.
 * Shorthand for @Inject(I18N_SERVICE).
 */
export const InjectI18n = () => Inject(I18N_SERVICE);
