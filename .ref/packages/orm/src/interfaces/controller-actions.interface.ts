/**
 * @file controller-actions.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description ControllerActions interface.
 */

/**
 * Actions that can be enabled/disabled on the generated controller.
 */
export interface ControllerActions {
  /** Enable GET / (list). Default: true. */
  list?: boolean;
  /** Enable GET /:id (show). Default: true. */
  show?: boolean;
  /** Enable POST / (create). Default: true. */
  create?: boolean;
  /** Enable PUT /:id (update). Default: true. */
  update?: boolean;
  /** Enable DELETE /:id (soft delete). Default: true. */
  delete?: boolean;
  /** Enable POST /:id/restore (restore soft-deleted). Default: true. */
  restore?: boolean;
  /** Enable DELETE /:id/force (permanent delete). Default: false. */
  forceDelete?: boolean;
}
