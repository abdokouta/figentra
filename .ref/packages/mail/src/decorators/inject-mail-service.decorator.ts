import { Inject } from '@nestjs/common';

import { MAIL_SERVICE } from '../constants';

/**
 * Inject Mail Service Decorator
 *
 * Decorator for injecting the MailService into a class.
 *
 * This decorator is a convenience wrapper around NestJS's @Inject decorator,
 * providing a more semantic way to inject the MailService. It uses the
 * MAIL_SERVICE injection token to retrieve the service instance from the
 * NestJS dependency injection container.
 *
 * **Benefits**:
 * - Cleaner, more readable code
 * - Type-safe injection
 * - Consistent with other Nesvel decorators
 * - Better IDE autocomplete support
 *
 * Using this decorator is equivalent to using @Inject(MAIL_SERVICE) but
 * provides better readability and makes the intent clearer.
 *
 * @returns A parameter decorator for dependency injection
 *
 * @example Basic usage in a service
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectMailService, MailService } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectMailService() private readonly mail: MailService
 *   ) {}
 *
 *   async sendWelcomeEmail(user: User) {
 *     await this.mail.sendMail({
 *       to: user.email,
 *       subject: 'Welcome!',
 *       template: 'welcome',
 *       context: { name: user.name },
 *     });
 *   }
 * }
 * ```
 *
 * @example Usage in a controller
 * ```typescript
 * import { Controller, Post, Body } from '@nestjs/common';
 * import { InjectMailService, MailService } from '@nesvel/nestjs-mail';
 *
 * @Controller('notifications')
 * export class NotificationController {
 *   constructor(
 *     @InjectMailService() private readonly mail: MailService
 *   ) {}
 *
 *   @Post('send')
 *   async sendNotification(@Body() data: NotificationDto) {
 *     await this.mail.sendMail({
 *       to: data.email,
 *       subject: data.subject,
 *       template: 'notification',
 *       context: data,
 *     });
 *     return { message: 'Notification sent' };
 *   }
 * }
 * ```
 *
 * @example Multiple injections
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectMailService, MailService } from '@nesvel/nestjs-mail';
 * import { InjectPubSub, PubSubService } from '@nesvel/nestjs-pubsub';
 *
 * @Injectable()
 * export class OrderService {
 *   constructor(
 *     @InjectMailService() private readonly mail: MailService,
 *     @InjectPubSub() private readonly pubsub: PubSubService,
 *     private readonly orderRepository: OrderRepository,
 *   ) {}
 *
 *   async createOrder(orderData: CreateOrderDto) {
 *     const order = await this.orderRepository.create(orderData);
 *
 *     // Send confirmation email
 *     await this.mail.sendMail({
 *       to: order.customerEmail,
 *       subject: `Order Confirmation - ${order.id}`,
 *       template: 'order-confirmation',
 *       context: order,
 *     });
 *
 *     // Publish order event
 *     await this.pubsub.publish('order.created', order);
 *
 *     return order;
 *   }
 * }
 * ```
 *
 * @example With custom repository pattern
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectMailService, MailService } from '@nesvel/nestjs-mail';
 * import { InjectRepository } from '@mikro-orm/nestjs';
 *
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectMailService() private readonly mail: MailService,
 *     @InjectRepository(User)
 *     private readonly userRepo: EntityRepository<User>,
 *   ) {}
 *
 *   async registerUser(dto: RegisterDto) {
 *     const user = this.userRepo.create(dto);
 *     await this.userRepo.persistAndFlush(user);
 *
 *     await this.mail.sendMail({
 *       to: user.email,
 *       subject: 'Welcome to Our Platform',
 *       template: 'registration',
 *       context: { user },
 *     });
 *
 *     return user;
 *   }
 * }
 * ```
 *
 * @example In a background job processor
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectMailService, MailService } from '@nesvel/nestjs-mail';
 * import { Cron, CronExpression } from '@nestjs/schedule';
 *
 * @Injectable()
 * export class ReportService {
 *   constructor(
 *     @InjectMailService() private readonly mail: MailService,
 *     private readonly analyticsService: AnalyticsService,
 *   ) {}
 *
 *   @Cron(CronExpression.EVERY_DAY_AT_9AM)
 *   async sendDailyReport() {
 *     const report = await this.analyticsService.generateDailyReport();
 *
 *     await this.mail.sendMail({
 *       to: 'admin@example.com',
 *       subject: `Daily Report - ${new Date().toLocaleDateString()}`,
 *       template: 'daily-report',
 *       context: { report },
 *     });
 *   }
 * }
 * ```
 *
 * @author Nesvel
 * @since 1.0.0
 */
export function InjectMailService(): ParameterDecorator {
  return Inject(MAIL_SERVICE);
}
