# @nesvel/nestjs-mail

> Enterprise-grade email module for NestJS with Laravel-inspired Mailables, BullMQ queues, and React email templates.

[![npm version](https://badge.fury.io/js/%40nesvel%2Fnestjs-mail.svg)](https://www.npmjs.com/package/@nesvel/nestjs-mail)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 📧 **Email Sending**

- Multiple transport providers (SMTP, AWS SES, SendGrid, Mailgun, Postmark)
- Laravel-inspired Mailable classes with fluent API
- Support for attachments, inline images, and CC/BCC
- Priority levels and custom headers
- Gmail structured data markup (Orders, Reservations)

### ⚛️ **Templates**

- React/TSX email templates via `@react-email`
- Traditional templates (Handlebars, Pug, EJS)
- Type-safe template context
- Reusable UI components

### 🚀 **Queue System** (Enterprise)

- **BullMQ** integration for async email processing
- Exponential/linear/fixed retry strategies
- Job prioritization (5 levels: CRITICAL → BULK)
- Dead letter queue for failed jobs
- Rate limiting to respect provider limits
- Real-time metrics and monitoring
- Graceful shutdown handling

### 🌍 **Internationalization**

- Built-in i18n support
- Per-user locale detection
- Multi-language email templates

### 🎯 **Developer Experience**

- Full TypeScript support
- Comprehensive logging
- Development email previews
- Example Mailables included

---

## 📦 Installation

```bash
bun add @nesvel/nestjs-mail

# Peer dependencies
bun add @nestjs/common @nestjs/core nodemailer

# Optional: For queue support
bun add @nestjs/bullmq bullmq ioredis

# Optional: For React templates
bun add @react-email/render @react-email/components react react-dom

# Dev dependencies
bun add -D @types/nodemailer
```

---

## 🚀 Quick Start

### 1. Register Module

```typescript
// app.module.ts
import { MailModule } from '@nesvel/nestjs-mail';

@Module({
  imports: [
    // Basic setup (synchronous emails)
    MailModule.forRootAsync(),

    // With queue (async emails)
    MailModule.forRootAsync({
      queue: {
        enabled: true,
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        worker: {
          concurrency: 5,
        },
        retry: {
          strategy: 'exponential',
          maxAttempts: 3,
        },
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Create a Mailable

```typescript
// mailables/welcome.mailable.ts
import { Mailable } from '@nesvel/nestjs-mail';

export class WelcomeMailable extends Mailable {
  constructor(private user: User) {
    super();
  }

  build() {
    return this.subject(`Welcome, ${this.user.name}!`)
      .template('emails/welcome')
      .locale(this.user.preferredLocale || 'en')
      .with({
        userName: this.user.name,
        dashboardUrl: process.env.APP_URL + '/dashboard',
      });
  }
}
```

### 3. Send Email

```typescript
// auth.service.ts
import { Injectable } from '@nestjs/common';
import { MailService } from '@nesvel/nestjs-mail';
import { WelcomeMailable } from './mailables/welcome.mailable';

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  async register(user: User) {
    // Send immediately
    await this.mailService.to(user.email).send(new WelcomeMailable(user));

    // Or queue for async processing
    await this.mailService.to(user.email).queue(new WelcomeMailable(user));
  }
}
```

---

## 📖 Usage Guide

### Mailable Classes (Laravel-inspired)

Mailables are reusable email classes that encapsulate email logic:

```typescript
import { Mailable, Attachment } from '@nesvel/nestjs-mail';

export class OrderShippedMailable extends Mailable {
  constructor(
    private order: Order,
    private invoicePath?: string,
  ) {
    super();
  }

  build() {
    this.subject(`Order #${this.order.number} Shipped!`)
      .template('emails/order-shipped')
      .locale(this.order.customer.locale)
      .with({
        order: this.order,
        trackingUrl: this.order.trackingUrl,
      })
      .priority(3); // High priority

    // Attach invoice if available
    if (this.invoicePath) {
      this.attach(Attachment.fromPath(this.invoicePath).as(`invoice-${this.order.number}.pdf`));
    }

    return this;
  }
}
```

### Fluent API

```typescript
// Simple send
await mailService.to('user@example.com').send(new WelcomeMailable(user));

// Multiple recipients
await mailService
  .to(['user1@example.com', 'user2@example.com'])
  .cc('manager@example.com')
  .bcc('archive@example.com')
  .send(new OrderShippedMailable(order));

// Queue for async processing
await mailService.to(user.email).queue(new WelcomeMailable(user));

// Detect locale from user object
await mailService
  .to(user) // Calls user.preferredLocale() if available
  .send(new WelcomeMailable(user));
```

### Direct Sending (without Mailables)

```typescript
await mailService.sendMail({
  to: 'user@example.com',
  subject: 'Test Email',
  template: 'emails/test',
  context: {
    name: 'John',
    message: 'Hello!',
  },
  attachments: [
    {
      filename: 'file.pdf',
      path: '/path/to/file.pdf',
    },
  ],
});
```

### Bulk Sending

```typescript
const recipients = ['user1@example.com', 'user2@example.com'];

await mailService.sendMailToMany(recipients, {
  subject: 'Newsletter',
  template: 'emails/newsletter',
  context: { articles: [...] },
});
```

---

## 🔥 Queue System

### Basic Queue Setup

```typescript
MailModule.forRootAsync({
  queue: {
    enabled: true,
    connection: process.env.REDIS_URL,
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
  },
});
```

### Job Priorities

```typescript
import { MAIL_JOB_PRIORITIES, MailQueueService } from '@nesvel/nestjs-mail';

@Injectable()
export class NotificationService {
  constructor(private queueService: MailQueueService) {}

  async sendPasswordReset(user: User, token: string) {
    await this.queueService.addMailJob(new PasswordResetMailable(user, token), {
      priority: MAIL_JOB_PRIORITIES.CRITICAL, // Sent first
      attempts: 5,
      timeout: 10000,
    });
  }

  async sendNewsletter(users: User[]) {
    await this.queueService.addBulkMailJobs(
      users.map((user) => ({
        mailable: new NewsletterMailable(user),
        options: { priority: MAIL_JOB_PRIORITIES.BULK }, // Sent last
      })),
    );
  }
}
```

**Priority Levels**:

- `CRITICAL` (1) - Password resets, OTP, security alerts
- `HIGH` (3) - Order confirmations, payment receipts
- `NORMAL` (5) - Account notifications, updates
- `LOW` (7) - Digest emails, weekly summaries
- `BULK` (10) - Newsletters, marketing campaigns

### Retry Strategies

```typescript
queue: {
  retry: {
    strategy: 'exponential', // or 'linear', 'fixed', 'custom'
    maxAttempts: 5,
    initialDelay: 1000,  // 1s
    maxDelay: 60000,     // 1 minute cap
    factor: 2,           // Double delay each retry
  },
}
```

**Exponential backoff**: `1s → 2s → 4s → 8s → 16s → 32s → 60s (capped)`

### Scheduled Emails

```typescript
await queueService.addMailJob(new ReminderMailable(event), {
  delay: 24 * 60 * 60 * 1000, // Send in 24 hours
});
```

### Queue Monitoring

```typescript
import { Injectable } from '@nestjs/common';
import { MailQueueService } from '@nesvel/nestjs-mail';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class QueueHealthService {
  constructor(private queueService: MailQueueService) {}

  @Cron('*/5 * * * *') // Every 5 minutes
  async checkQueueHealth() {
    const stats = await this.queueService.getQueueStats();

    console.log({
      waiting: stats.waiting,
      active: stats.active,
      failed: stats.failed,
      errorRate: stats.errorRate + '%',
    });

    // Alert if error rate is high
    if (stats.errorRate > 10) {
      await this.alertAdmin('High email failure rate!');
    }

    // Clean old jobs (weekly)
    if (new Date().getDay() === 0) {
      await this.queueService.cleanQueue(7 * 24 * 60 * 60 * 1000);
    }
  }
}
```

### Production Queue Config

```typescript
queue: {
  enabled: true,
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  },
  worker: {
    concurrency: 10, // Process 10 emails simultaneously
  },
  retry: {
    strategy: 'exponential',
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 60000,
  },
  rateLimit: {
    max: 100,         // 100 emails
    duration: 60000,  // Per minute
  },
  monitoring: {
    enableMetrics: true,
    enableHealthChecks: true,
    eventHandlers: {
      onFailed: async (jobId, error) => {
        // Send to error tracking (Sentry, etc.)
        console.error(`Email job ${jobId} failed:`, error);
      },
    },
  },
  deadLetterQueue: {
    enabled: true,
    queueName: 'mail:dead-letter',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}
```

---

## 🌍 Internationalization

### Setup

Mailables automatically support localization:

```typescript
export class WelcomeMailable extends Mailable {
  constructor(private user: User) {
    super();
  }

  build() {
    return this.subject('Welcome!') // Will be translated
      .template('emails/welcome')
      .locale(this.user.preferredLocale || 'en')
      .with({ userName: this.user.name });
  }
}
```

### Template Structure

```
templates/
├── emails/
│   ├── en/
│   │   └── welcome.hbs
│   ├── es/
│   │   └── welcome.hbs
│   └── fr/
│       └── welcome.hbs
```

---

## 📧 Transport Providers

### SMTP

```env
MAIL_TRANSPORT=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### AWS SES

```env
MAIL_TRANSPORT=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### SendGrid

```env
MAIL_TRANSPORT=sendgrid
SENDGRID_API_KEY=your-api-key
```

### Mailgun

```env
MAIL_TRANSPORT=mailgun
MAILGUN_USER=your-user
MAILGUN_PASSWORD=your-password
```

### Postmark

```env
MAIL_TRANSPORT=postmark
POSTMARK_API_TOKEN=your-token
```

---

## ⚛️ React Email Templates

### Install Dependencies

```bash
bun add @react-email/components @react-email/render
```

### Create Template

```tsx
// templates/emails/welcome.tsx
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components';

interface WelcomeEmailProps {
  userName: string;
  dashboardUrl: string;
}

export default function WelcomeEmail({ userName, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif' }}>
        <Container>
          <Heading>Welcome, {userName}!</Heading>
          <Text>We're excited to have you on board.</Text>
          <Button href={dashboardUrl}>Get Started</Button>
        </Container>
      </Body>
    </Html>
  );
}
```

### Configure Adapter

```env
MAIL_TEMPLATE_ADAPTER=react
MAIL_TEMPLATE_DIR=./templates/emails
```

---

## 📎 Attachments

### From File Path

```typescript
import { Attachment } from '@nesvel/nestjs-mail';

mailable.attach(
  Attachment.fromPath('/path/to/file.pdf').as('invoice.pdf').withMime('application/pdf'),
);
```

### From Buffer

```typescript
const pdfBuffer = await generateInvoicePDF(order);

mailable.attach(Attachment.fromBuffer(pdfBuffer).as('invoice.pdf').withMime('application/pdf'));
```

### From URL

```typescript
mailable.attach(Attachment.fromUrl('https://example.com/logo.png').as('logo.png'));
```

### Inline Images

```typescript
mailable.attach(Attachment.fromPath('/path/to/logo.png').as('logo.png').inline('logo'));

// In template: <img src="cid:logo" />
```

---

## 🔧 Configuration

### Environment Variables

```env
# Transport
MAIL_TRANSPORT=smtp

# SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-password

# Sender
MAIL_FROM="App Name" <noreply@app.com>

# Templates
MAIL_TEMPLATE_DIR=./templates/emails
MAIL_TEMPLATE_ADAPTER=react

# Queue (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
QUEUE_ENABLED=true
QUEUE_CONCURRENCY=5
```

### Custom Configuration

```typescript
import { IMailConfig } from '@nesvel/nestjs-mail';

const customMailConfig: IMailConfig = {
  transport: 'smtp',
  smtp: {
    host: 'smtp.custom.com',
    port: 587,
    secure: false,
    auth: {
      user: 'user@custom.com',
      pass: 'password',
    },
  },
  defaults: {
    from: '"App" <noreply@app.com>',
  },
  template: {
    dir: './templates',
    adapter: 'react',
  },
};

@Module({
  imports: [
    MailModule.forRoot({
      config: customMailConfig,
    }),
  ],
})
export class AppModule {}
```

---

## 📝 API Reference

### MailService

```typescript
// Fluent API
mailService.to(recipients);
mailService.cc(recipients);
mailService.bcc(recipients);
mailService.send(mailable);
mailService.queue(mailable);

// Direct methods
mailService.sendMail(options);
mailService.sendMailToMany(recipients, options);
mailService.sendTransactionalEmail(options);
mailService.sendMarketingEmail(options);
```

### MailQueueService

```typescript
// Job management
queueService.addMailJob(mailable, options);
queueService.addBulkMailJobs(jobs);
queueService.getJob(jobId);
queueService.removeJob(jobId);
queueService.retryJob(jobId);

// Queue control
queueService.pauseQueue();
queueService.resumeQueue();
queueService.cleanQueue(age);
queueService.drainQueue();

// Monitoring
queueService.getQueueStats();
queueService.getFailedJobs();
queueService.getWaitingJobs();
queueService.getActiveJobs();
```

### Mailable

```typescript
// Configuration
mailable.subject(subject);
mailable.template(template);
mailable.locale(locale);
mailable.from(address, name);
mailable.to(address, name);
mailable.cc(address, name);
mailable.bcc(address, name);
mailable.replyTo(address, name);
mailable.attach(...attachments);
mailable.with(key, value);
mailable.priority(level);

// Must implement
mailable.build();
```

---

## 🧪 Testing

```typescript
// mail.service.spec.ts
import { Test } from '@nestjs/testing';
import { MailService } from '@nesvel/nestjs-mail';

describe('MailService', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        MailModule.forRoot({
          // Test configuration
        }),
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should send email', async () => {
    const result = await mailService.sendMail({
      to: 'test@example.com',
      subject: 'Test',
      template: 'test',
      context: { name: 'Test' },
    });

    expect(result).toBeDefined();
    expect(result.messageId).toBeDefined();
  });
});
```

---

## 📚 Examples

See the [`examples/`](./examples/) directory for complete examples:

- **WelcomeMailable**: New user welcome email
- **OrderShippedMailable**: Order notification with tracking
- **PasswordResetMailable**: Secure password reset

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md).

---

## 📄 License

MIT © [Nesvel](https://github.com/nesvel)

---

## 🔗 Links

- [Documentation](https://nesvel.dev/docs/mail)
- [GitHub](https://github.com/nesvel/nesvel/tree/main/packages/nestjs-mail)
- [Issue Tracker](https://github.com/nesvel/nesvel/issues)
- [Changelog](./CHANGELOG.md)

---

## 💡 Tips

### Gmail App Passwords

When using Gmail SMTP, create an [App Password](https://support.google.com/accounts/answer/185833):

1. Enable 2-factor authentication
2. Go to Google Account → Security → App passwords
3. Generate password for "Mail"
4. Use generated password in `MAIL_PASSWORD`

### Redis for Production

For production queues, use managed Redis:

- **AWS**: ElastiCache
- **Azure**: Azure Cache for Redis
- **GCP**: Memorystore
- **Other**: Redis Cloud, Upstash

### Rate Limiting

Configure rate limiting to avoid hitting provider limits:

```typescript
queue: {
  rateLimit: {
    max: 100,        // SendGrid free: 100/day
    duration: 86400000,  // 24 hours
  },
}
```

### Monitoring

Integrate with monitoring services:

```typescript
monitoring: {
  eventHandlers: {
    onFailed: async (jobId, error) => {
      // Send to Sentry
      Sentry.captureException(error, {
        tags: { jobId, service: 'mail' },
      });
    },
  },
}
```
