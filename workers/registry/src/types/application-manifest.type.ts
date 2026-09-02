/**
 * @file application-manifest.type.ts
 * @description Runtime type inferred from the canonical Registry manifest schema.
 */
import type { z } from 'zod';
import type { applicationManifestSchema } from '../schemas/application-manifest.schema.js';

/**
 * Validated application registration manifest.
 */
export type ApplicationManifest = z.infer<typeof applicationManifestSchema>;
