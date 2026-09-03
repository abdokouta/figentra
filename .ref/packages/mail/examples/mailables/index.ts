/**
 * Example Mailable Classes
 *
 * This directory contains real-world examples of Mailable classes
 * that you can use as templates for your own email implementations.
 *
 * ## Available Examples
 *
 * - **WelcomeMailable**: New user welcome email with personalization
 * - **OrderShippedMailable**: Order shipping notification with tracking
 * - **PasswordResetMailable**: Secure password reset with time-limited tokens
 *
 * ## Usage
 *
 * Copy these examples to your application and modify them to match
 * your requirements. Each example demonstrates different features:
 *
 * - Template rendering
 * - Localization (i18n)
 * - File attachments
 * - Priority levels
 * - Queue integration
 * - Data transformation
 *
 * ## Creating Your Own Mailables
 *
 * 1. Extend the `Mailable` base class
 * 2. Implement the `build()` method
 * 3. Configure subject, template, and data using fluent API
 * 4. Optionally add attachments, priorities, and queue config
 *
 * @example
 * ```typescript
 * import { Mailable } from '@nesvel/nestjs-mail';
 *
 * export class MyCustomMailable extends Mailable {
 *   constructor(private data: any) {
 *     super();
 *   }
 *
 *   build() {
 *     return this
 *       .subject('My Subject')
 *       .template('emails/my-template')
 *       .with('data', this.data);
 *   }
 * }
 * ```
 */

export * from './welcome.mailable';
export * from './order-shipped.mailable';
export * from './password-reset.mailable';
