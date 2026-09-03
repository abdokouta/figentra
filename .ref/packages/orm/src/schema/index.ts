/**
 * @file index.ts
 * @description Barrel export for the schema builder module.
 */

export { defineSchema, collectSchemas } from './build-schema';
export { buildTranslationSchema } from './build-translation-schema';
export { generateZodSchemas, type IGeneratedSchemas } from './generate-zod-schema';
