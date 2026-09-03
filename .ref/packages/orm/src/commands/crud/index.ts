/**
 * @file index.ts
 * @module @stackra/nestjs-orm/commands/crud
 * @description Barrel export for generic CRUD CLI commands.
 *   These commands work with ANY registered entity dynamically —
 *   they read the entity schema from the ORM and prompt for fields interactively.
 */

export { EntityCreateCommand } from './entity-create.command';
export { EntityListCommand } from './entity-list.command';
export { EntityShowCommand } from './entity-show.command';
export { EntityUpdateCommand } from './entity-update.command';
export { EntityDeleteCommand } from './entity-delete.command';
export { EntityCountCommand } from './entity-count.command';
