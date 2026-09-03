/**
 * @file application-factory-options.interface.ts
 * @module @stackra/container/src/interfaces
 * @description Options for ApplicationFactory.create().
 */

/**
 * Options for ApplicationFactory.create().
 */
export interface IApplicationFactoryOptions {
  /** Optional name for this application context. */
  name?: string;
  /** Application configuration (injected as APP_CONFIG token). */
  config?: Record<string, unknown>;
  /** Preview mode (no lifecycle hooks). */
  preview?: boolean;
  /** Debug mode — enables verbose logging. */
  debug?: boolean;
  /** Global context name. */
  globalName?: string;
  /** Register runtime shutdown signal handlers. */
  shutdownHooks?: boolean;
  /** Register this context as the global application context. Defaults to true. */
  registerGlobal?: boolean;
  /** Auto-flush logs on shutdown. */
  autoFlushLogs?: boolean;
  /** Buffer logs until bootstrap completes. */
  bufferLogs?: boolean;
  /** Callback invoked after bootstrap. */
  onReady?: (context: unknown) => void | Promise<void>;
}
