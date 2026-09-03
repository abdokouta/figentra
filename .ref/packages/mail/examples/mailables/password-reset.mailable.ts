import { Mailable } from '@nesvel/nestjs-mail';

/**
 * User interface for password reset
 */
interface User {
  id: string;
  name: string;
  email: string;
  preferredLocale?: string;
}

/**
 * PasswordResetMailable
 *
 * Sends a password reset link to users who requested it.
 *
 * **Security Features**:
 * - Time-limited reset token
 * - Single-use token (implement in backend)
 * - IP address tracking (optional)
 * - Security warning if not requested
 *
 * **Best Practices**:
 * - Send immediately (don't queue) for security
 * - Short expiration time (15-60 minutes)
 * - Log all reset attempts
 * - Rate limit reset requests
 *
 * @example Basic usage
 * ```typescript
 * const mailable = PasswordResetMailable.make(user, resetToken);
 * await mailService
 *   .to(user.email)
 *   .send(mailable); // Send immediately, don't queue!
 * ```
 *
 * @example With custom expiration
 * ```typescript
 * const mailable = PasswordResetMailable.make(user, resetToken, 30); // 30 minutes
 * await mailService.to(user.email).send(mailable);
 * ```
 *
 * @example With IP tracking
 * ```typescript
 * const mailable = PasswordResetMailable.make(
 *   user,
 *   resetToken,
 *   60,
 *   '192.168.1.1'
 * );
 * await mailService.to(user.email).send(mailable);
 * ```
 */
export class PasswordResetMailable extends Mailable {
  /**
   * Creates a password reset email instance
   *
   * @param user - User requesting password reset
   * @param resetToken - Unique reset token
   * @param expirationMinutes - Token expiration time in minutes (default: 60)
   * @param requestIp - Optional IP address of the request
   */
  constructor(
    private readonly user: User,
    private readonly resetToken: string,
    private readonly expirationMinutes: number = 60,
    private readonly requestIp?: string,
  ) {
    super();
  }

  /**
   * Build the email content and configuration
   *
   * @returns this for method chaining
   */
  build(): this {
    // Build reset URL
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${this.resetToken}&email=${encodeURIComponent(this.user.email)}`;

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + this.expirationMinutes * 60 * 1000);

    return this.subject('Reset Your Password')
      .template('emails/password-reset')
      .locale(this.user.preferredLocale || 'en')
      .with({
        userName: this.user.name,
        userEmail: this.user.email,
        resetUrl,
        resetToken: this.resetToken,
        expirationMinutes: this.expirationMinutes,
        expiresAt: expiresAt.toLocaleString(),
        requestIp: this.requestIp,
        requestedAt: new Date().toLocaleString(),
        supportUrl: `${process.env.APP_URL}/support`,
        securityUrl: `${process.env.APP_URL}/security`,
        year: new Date().getFullYear(),
      })
      .priority(1); // Highest priority - critical security email
  }
}
