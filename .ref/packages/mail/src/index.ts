/**
 * Mail Module Exports
 *
 * Central export point for the mail module.
 *
 * @module mail
 */

// Re-export types and interfaces from @nestjs-modules/mailer
export type {
  MailerOptions,
  ISendMailOptions,
  MailerOptionsFactory,
  MailerTransportFactory,
} from '@nestjs-modules/mailer';

export type { TemplateAdapter } from '@nestjs-modules/mailer';

// Re-export adapters from @nestjs-modules/mailer
export { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
export { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
export { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

// Export our custom implementations
export * from './enums';
export * from '../config';
export * from './markup';
export * from './services';
export * from './adapters';
export * from './resources';
export * from './providers';
export * from './interfaces';
export * from './exceptions';
export * from './constants';
export * from './decorators';
export * from './processors'; // BullMQ processors for queue
export * from './classes'; // Laravel-inspired fluent API
export * from './mail.module';
