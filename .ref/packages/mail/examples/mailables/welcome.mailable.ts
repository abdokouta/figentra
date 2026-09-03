import { Mailable } from '@nesvel/nestjs-mail';

/**
 * User interface example
 * Replace with your actual User entity/interface
 */
interface User {
  id: string;
  name: string;
  email: string;
  preferredLocale?: string;
}

/**
 * WelcomeMailable
 *
 * Sends a welcome email to newly registered users.
 *
 * **Features**:
 * - Personalized greeting
 * - Multi-language support via locale
 * - Getting started tips
 * - Call-to-action button
 *
 * @example Send immediately
 * ```typescript
 * await mailService
 *   .to(user.email)
 *   .send(WelcomeMailable.make(user));
 * ```
 *
 * @example Queue for async processing
 * ```typescript
 * await mailService
 *   .to(user.email)
 *   .queue(WelcomeMailable.make(user));
 * ```
 *
 * @example With custom locale
 * ```typescript
 * const welcome = WelcomeMailable.make(user);
 * welcome.locale('es'); // Spanish
 * await mailService.to(user.email).send(welcome);
 * ```
 */
export class WelcomeMailable extends Mailable {
  /**
   * Creates a welcome email instance
   *
   * @param user - User who registered
   */
  constructor(private readonly user: User) {
    super();
  }

  /**
   * Build the email content and configuration
   *
   * @returns this for method chaining
   */
  build(): this {
    return this.subject(`Welcome to Our Platform, ${this.user.name}!`)
      .template('emails/welcome') // references templates/emails/welcome.hbs
      .locale(this.user.preferredLocale || 'en')
      .with({
        userName: this.user.name,
        userEmail: this.user.email,
        dashboardUrl: `${process.env.APP_URL}/dashboard`,
        helpUrl: `${process.env.APP_URL}/help`,
        profileUrl: `${process.env.APP_URL}/profile/${this.user.id}`,
        year: new Date().getFullYear(),
      })
      .priority(3); // High priority for transactional emails
  }
}
