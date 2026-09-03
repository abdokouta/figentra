/**
 * Email Priority Header Values
 *
 * Maps EmailPriority to X-Priority header values
 * Per RFC 2156: 1 (highest) to 5 (lowest)
 *
 * @enum EmailPriorityHeader
 */
export enum EmailPriorityHeader {
  /**
   * High priority header value
   */
  HIGH = '1',

  /**
   * Normal priority header value
   */
  NORMAL = '3',

  /**
   * Low priority header value
   */
  LOW = '5',
}
