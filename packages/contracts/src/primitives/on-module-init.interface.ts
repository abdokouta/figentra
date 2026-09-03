/**
 * @file on-module-init.interface.ts
 * @module @stackra/contracts/primitives
 * @description Lifecycle hook invoked after the host module's providers
 *   are instantiated. Use for module-local initialisation — seeding a
 *   registry from config, opening a connection pool, etc.
 *
 *   Fires BEFORE `OnApplicationBootstrap`. See `module-lifecycle.md`
 *   for the canonical lifecycle ordering.
 */

/**
 * Implement on any `@Injectable()` class that needs post-construction
 * initialisation scoped to its own module.
 *
 * @example
 * ```ts
 * import type { OnModuleInit } from "@stackra/contracts";
 *
 * @Injectable()
 * class FooRegistry implements OnModuleInit {
 *   onModuleInit(): void {
 *     this.seed();
 *   }
 * }
 * ```
 */
export interface OnModuleInit {
  /** Called after the module's providers are instantiated. */
  onModuleInit(): void | Promise<void>;
}
