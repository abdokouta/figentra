/**
 * @file on-init.interface.ts
 * @module @stackra/contracts/interfaces/hooks
 * @description Interface defining method called once the host module has been initialized.
 * @see Lifecycle hook contract shared across every `@stackra/*` module
 * @publicApi
 */
export interface OnModuleInit {
  onModuleInit(): any;
}
