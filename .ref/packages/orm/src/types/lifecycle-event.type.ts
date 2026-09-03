/**
 * @file lifecycle-event.type.ts
 * @module @stackra/orm/src/types
 * @description LifecycleEvent type.
 */

/** Supported lifecycle event names. */
export type LifecycleEvent =
  | 'beforeCreate'
  | 'afterCreate'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeDelete'
  | 'afterDelete';
