# Mail Module

Comprehensive email sending module for NestJS using [@nestjs-modules/mailer](https://github.com/nest-modules/mail) with React template support.

## Features

- 📧 **Multiple Transport Options**: SMTP, AWS SES, Sendgrid, Mailgun, Postmark
- ⚛️ **React Templates**: Use React/TSX components for email templates
- 🎨 **Multiple Template Engines**: React, Handlebars, Pug, EJS
- 📎 **Attachments**: Full support for email attachments
- 🔄 **Async/Queue Support**: Ready for job queue integration
- 🌍 **i18n Support**: Internationalization ready
- 🎯 **Type-Safe**: Full TypeScript support
- 📝 **Email Previews**: Development email previews
- 🚀 **Production Ready**: Comprehensive error handling and logging

## Installation

The module uses the following dependencies:

```bash
bun add @nestjs-modules/mailer nodemailer
bun add @react-email/render locter
bun add -D @types/nodemailer
```

## Configuration

### Environment Variables

```env
# Transport type (smtp, ses, sendgrid, mailgun, postmark)
MAIL_TRANSPORT=smtp

# SMTP Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_TLS_REJECT_UNAUTHORIZED=true

# Default sender
MAIL_FROM="Your App" <noreply@yourapp.com>

# Templates
MAIL_TEMPLATE_DIR=./templates/emails
MAIL_TEMPLATE_ADAPTER=react

# AWS SES (if using SES transport)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Sendgrid (if using sendgrid transport)
SENDGRID_API_KEY=your-sendgrid-api-key

# Mailgun (if using mailgun transport)
MAILGUN_USER=your-mailgun-user
MAILGUN_PASSWORD=your-mailgun-password

# Postmark (if using postmark transport)
POSTMARK_API_TOKEN=your-postmark-token
```

### Module Registration

```typescript
// app.module.ts
import { MailModule } from './modules/mail';

@Module({
  imports: [
    // Recommended: Async registration with ConfigService
    MailModule.forRootAsync(),

    // Or: Synchronous registration
    // MailModule.forRoot(),
  ],
})
export class AppModule {}
```

## Usage

### Basic Email Sending

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from '@modules/mail';

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  async sendWelcomeEmail(user: User) {
    await this.mailService.sendMail({
      to: user.email,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      context: {
        name: user.name,
        loginUrl: 'https://example.com/login',
      },
    });
  }
}
```

### Email with Attachments

```typescript
await mailService.sendMail({
  to: 'user@example.com',
  subject: 'Your Invoice',
  template: 'invoice',
  context: { invoiceNumber: '12345' },
  attachments: [
    {
      filename: 'invoice.pdf',
      path: '/path/to/invoice.pdf',
      contentType: 'application/pdf',
    },
  ],
});
```

### Bulk Email Sending

```typescript
const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

await mailService.sendMailToMany(recipients, {
  subject: 'Newsletter',
  template: 'newsletter',
  context: {
    month: 'January',
    articles: [...],
  },
});
```

### Priority Emails

```typescript
// High priority (transactional)
await mailService.sendTransactionalEmail({
  to: user.email,
  subject: 'Password Reset Request',
  template: 'reset-password',
  context: { resetUrl, expiresIn: '1 hour' },
});

// Low priority (marketing)
await mailService.sendMarketingEmail({
  to: user.email,
  subject: 'New Features Available!',
  template: 'feature-announcement',
  context: { features },
});
```

## React Email Templates

### Creating Templates

Create React components in your templates directory:

```tsx
// templates/emails/welcome.tsx
import { Html, Head, Body, Container, Heading, Text, Button, Hr } from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export default function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Welcome, {name}!</Heading>

          <Text style={styles.text}>
            We're excited to have you on board. Get started by logging into your account.
          </Text>

          <Button href={loginUrl} style={styles.button}>
            Login to Your Account
          </Button>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            If you didn't create this account, please ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  },
  container: {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '580px',
  },
  heading: {
    fontSize: '32px',
    lineHeight: '1.3',
    fontWeight: '700',
    color: '#484848',
  },
  text: {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#484848',
  },
  button: {
    backgroundColor: '#5469d4',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px',
  },
  hr: {
    borderColor: '#e6ebf1',
    margin: '20px 0',
  },
  footer: {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
  },
};
```

### Using @react-email Components

Install React Email components:

```bash
bun add @react-email/components
```

Available components:

- `Html`, `Head`, `Body`: Document structure
- `Container`: Email container with max-width
- `Heading`, `Text`: Typography
- `Button`, `Link`: Interactive elements
- `Img`: Images with fallbacks
- `Hr`: Horizontal rules
- `Section`, `Row`, `Column`: Layout
- `Code`, `CodeBlock`: Code snippets

## Template Directory Structure

```
templates/
└── emails/
    ├── welcome.tsx
    ├── verify-email.tsx
    ├── reset-password.tsx
    ├── password-changed.tsx
    ├── notification.tsx
    └── components/
        ├── Header.tsx
        ├── Footer.tsx
        └── Button.tsx
```

## Development

### Email Previews

In development mode, emails are automatically previewed in your browser before sending:

```env
NODE_ENV=development
```

### Testing with Mailhog

For local development, use Mailhog to catch all outgoing emails:

```bash
# Run Mailhog with Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Configure environment
MAIL_HOST=localhost
MAIL_PORT=1025
```

View emails at: <http://localhost:8025>

## Production Considerations

### Using AWS SES

```env
MAIL_TRANSPORT=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### Using Sendgrid

```env
MAIL_TRANSPORT=sendgrid
SENDGRID_API_KEY=your-api-key
```

### Queue Integration

For high-volume email sending, integrate with a job queue:

```typescript
// In a Bull/BullMQ queue processor
@Processor('email')
export class EmailProcessor {
  constructor(private readonly mailService: MailService) {}

  @Process('send')
  async handleSendEmail(job: Job<SendEmailData>) {
    await this.mailService.sendMail(job.data);
  }
}
```

## API Reference

### MailService

#### `sendMail(options: SendMailOptions): Promise<SentMessageInfo>`

Send a single email.

#### `sendMailToMany(recipients: string[], options: SendMailOptions): Promise<SentMessageInfo[]>`

Send email to multiple recipients.

#### `sendTransactionalEmail(options: SendMailOptions): Promise<SentMessageInfo>`

Send high-priority transactional email.

#### `sendMarketingEmail(options: SendMailOptions): Promise<SentMessageInfo>`

Send low-priority marketing email.

### SendMailOptions

```typescript
interface SendMailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  priority?: 'high' | 'normal' | 'low';
  headers?: Record<string, string>;
}
```

## Troubleshooting

### Templates Not Found

Ensure `MAIL_TEMPLATE_DIR` points to the correct directory and template files exist.

### SMTP Authentication Failed

Check your MAIL_USER and MAIL_PASSWORD. For Gmail, use an App Password.

### React Rendering Errors

Ensure all React Email components are properly installed and templates export a default component.

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines first.
