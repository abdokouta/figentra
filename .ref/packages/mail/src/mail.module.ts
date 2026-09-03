import { BullModule } from '@nestjs/bullmq';
import { Module, DynamicModule, Global } from '@nestjs/common';
import { MailerModule as NestMailModule } from '@nestjs-modules/mailer';

import {
  MAIL_QUEUE,
  MAIL_SERVICE,
  MAIL_QUEUE_NAME,
  MAIL_QUEUE_SERVICE,
} from './constants/mail.constants';
import { IMailModuleOptions } from './interfaces';
import { mailConfig } from '../config/mail.config';
import { MailService } from './services/mail.service';
import { MailQueueService } from './services/queue.service';
import { SendMailProcessor } from './processors/send-mail.processor';
import { MailFactoryService } from './services/mail-factory.service';
import { MailOptionsFactoryService } from './services/mail-options-factory.service';

/**
 * MailModule
 *
 * Configures and provides email sending functionality throughout the application.
 *
 * @example
 * ```typescript
 * // Import in app.module.ts
 * @Module({
 *   imports: [
 *     MailModule.forRootAsync(),
 *   ],
 * })
 * export class AppModule {}
 *
 * // Use in a service
 * @Injectable()
 * export class UsersService {
 *   constructor(private readonly mailService: MailService) {}
 *
 *   async sendWelcomeEmail(user: User) {
 *     await this.mailService.sendMail({
 *       to: user.email,
 *       subject: 'Welcome to Our Platform',
 *       template: 'welcome',
 *       context: { name: user.name },
 *     });
 *   }
 * }
 * ```
 */
@Global()
@Module({})
export class MailModule {
  /**
   * Register mail module synchronously
   *
   * Uses the provided config or defaults to environment-based configuration.
   * Optionally enables queue processing with BullMQ if queue config is provided.
   *
   * @param options - Module options including optional queue configuration
   * @returns Dynamic module
   *
   * @example Without queue
   * ```typescript
   * MailModule.forRoot({
   *   config: myMailConfig,
   * });
   * ```
   *
   * @example With queue enabled
   * ```typescript
   * MailModule.forRoot({
   *   config: myMailConfig,
   *   queue: {
   *     enabled: true,
   *     connection: {
   *       host: 'localhost',
   *       port: 6379,
   *     },
   *     retry: {
   *       strategy: 'exponential',
   *       maxAttempts: 5,
   *     },
   *   },
   * });
   * ```
   */
  static forRoot(options: IMailModuleOptions = {}): DynamicModule {
    const config = options.config || mailConfig.config!;
    const factory = MailFactoryService.make();
    const optionsFactory = MailOptionsFactoryService.make(factory);
    const mailOptions = optionsFactory.createMailOptions(config);

    // Build imports array
    const imports: any[] = [NestMailModule.forRoot(mailOptions)];

    // Build providers array
    const providers: any[] = [
      MailService,
      MailFactoryService,
      MailOptionsFactoryService,
      {
        provide: MAIL_SERVICE,
        useExisting: MailService,
      },
    ];

    // Build exports array
    const exports: any[] = [
      MailService,
      MailFactoryService,
      MailOptionsFactoryService,
      MAIL_SERVICE,
    ];

    // Add queue if enabled
    if (options.queue?.enabled) {
      // Register BullMQ queue
      imports.push(
        BullModule.registerQueue({
          prefix: options.queue.prefix,
          connection: options.queue.connection as any,
          name: options.queue.queueName || MAIL_QUEUE_NAME,
          defaultJobOptions: options.queue.defaultJobOptions as any,
        }),
      );

      // Add queue-related providers
      providers.push(
        SendMailProcessor,
        {
          provide: MailQueueService,
          useFactory: (mailService: MailService, queueService: MailQueueService) => {
            queueService.setConfig(options.queue!);
            mailService.setQueueService(queueService);
            return queueService;
          },
          inject: [MailService, { token: MailQueueService, optional: false }],
        },
        {
          provide: MAIL_QUEUE_SERVICE,
          useExisting: MailQueueService,
        },
      );

      // Export queue service
      exports.push(MailQueueService, MAIL_QUEUE_SERVICE);
    }

    return {
      module: MailModule,
      global: options.isGlobal ?? true,
      imports,
      providers,
      exports,
    };
  }

  /**
   * Register mail module asynchronously
   *
   * This is the recommended approach as it allows configuration
   * to be loaded from environment variables and config files.
   * Uses dependency injection for factory services.
   * Optionally enables queue processing with BullMQ if queue config is provided.
   *
   * @param options - Module options including optional queue configuration
   * @returns Dynamic module
   *
   * @example Async without queue
   * ```typescript
   * MailModule.forRootAsync({
   *   config: myMailConfig,
   * });
   * ```
   *
   * @example Async with queue and monitoring
   * ```typescript
   * MailModule.forRootAsync({
   *   config: myMailConfig,
   *   queue: {
   *     enabled: true,
   *     connection: process.env.REDIS_URL,
   *     worker: { concurrency: 10 },
   *     retry: {
   *       strategy: 'exponential',
   *       maxAttempts: 5,
   *       initialDelay: 1000,
   *     },
   *     monitoring: {
   *       enableMetrics: true,
   *       enableHealthChecks: true,
   *     },
   *   },
   * });
   * ```
   */
  static forRootAsync(options: IMailModuleOptions = {}): DynamicModule {
    const config = options.config || mailConfig.config!;

    // Build imports array
    const imports: any[] = [
      NestMailModule.forRootAsync({
        useFactory: async (
          factory: MailFactoryService,
          optionsFactory: MailOptionsFactoryService,
        ) => {
          return optionsFactory.createMailOptions(config);
        },
        inject: [MailFactoryService, MailOptionsFactoryService],
      }),
    ];

    // Build providers array
    const providers: any[] = [
      MailService,
      MailFactoryService,
      MailOptionsFactoryService,
      {
        provide: MAIL_SERVICE,
        useExisting: MailService,
      },
    ];

    // Build exports array
    const exports: any[] = [
      MailService,
      MAIL_SERVICE,
      MailFactoryService,
      MailOptionsFactoryService,
    ];

    // Add queue if enabled
    if (options.queue?.enabled) {
      // Register BullMQ queue
      imports.push(
        BullModule.registerQueue({
          prefix: options.queue.prefix,
          connection: options.queue.connection as any,
          name: options.queue.queueName || MAIL_QUEUE_NAME,
          defaultJobOptions: options.queue.defaultJobOptions as any,
        }),
      );

      // Add queue-related providers
      providers.push(
        SendMailProcessor,
        {
          provide: MailQueueService,
          useFactory: (mailService: MailService, queueService: MailQueueService) => {
            queueService.setConfig(options.queue!);
            mailService.setQueueService(queueService);
            return queueService;
          },
          inject: [MailService, { token: MailQueueService, optional: false }],
        },
        {
          provide: MAIL_QUEUE_SERVICE,
          useExisting: MailQueueService,
        },
      );

      // Export queue service
      exports.push(MailQueueService, MAIL_QUEUE_SERVICE);
    }

    return {
      module: MailModule,
      global: options.isGlobal ?? true,
      imports,
      providers,
      exports,
    };
  }
}
