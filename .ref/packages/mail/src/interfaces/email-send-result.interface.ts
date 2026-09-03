/**
 * Email send result
 *
 * @interface SendResult
 */
export interface SendResult {
  /**
   * Whether email was sent successfully
   */
  success: boolean;

  /**
   * Message ID from mail server
   */
  messageId?: string;

  /**
   * Error message if failed
   */
  error?: string;

  /**
   * Recipient email address
   */
  to: string;
}
