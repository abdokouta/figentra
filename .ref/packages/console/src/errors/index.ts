/**
 * @file index.ts
 * @module @stackra/console/errors
 * @description Barrel export for console error classes.
 *
 *   Note: `ModuleAlreadyRegisteredError` was removed along with the
 *   `ConsoleModule.registered` double-init lock — the module now
 *   follows the workspace-standard `forRoot()` shape (no runtime
 *   lock; a double-forRoot call is a wiring bug caught at review).
 */

export { ConsoleError } from "./console.error";
export { CommandCancelledError } from "./command-cancelled.error";
export { DuplicateCommandError } from "./duplicate-command.error";
export { InvalidCommandNameError } from "./invalid-command-name.error";
export { MissingArgumentError } from "./missing-argument.error";
export { UnknownCommandError } from "./unknown-command.error";
