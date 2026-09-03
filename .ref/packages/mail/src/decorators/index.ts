/**
 * Mail Decorators
 *
 * Exports all decorators for the mail module.
 *
 * **Available Decorators**:
 * - `@InjectMailService()` - Injects MailService into a class
 * - `@InjectMailOptions()` - Injects mail configuration options into a class
 * - `@InjectMailTransport()` - Injects mail transport instance into a class
 *
 * @module Decorators
 * @author Nesvel
 * @since 1.0.0
 */

export * from './inject-mail-options.decorator';
export * from './inject-mail-service.decorator';
export * from './inject-mail-transport.decorator';
