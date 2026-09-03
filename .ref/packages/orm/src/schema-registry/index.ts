/**
 * @file index.ts
 * @module @stackra/nestjs-orm/schema-registry
 * @description Barrel export for the schema registry.
 */

export { SchemaRegistry } from './schema-registry.service';
export { SchemaRegistryPopulator } from './schema-registry-populator.service';
export { SchemaController } from './schema.controller';
export { entityToJsonSchema } from './entity-to-json-schema.util';
export type { IResourceSchema, IFieldSchema, IRelationSchema } from './schema-registry.interfaces';
