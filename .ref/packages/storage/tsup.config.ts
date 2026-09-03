import { defineConfig } from 'tsup';
import { nestLibPreset } from '@nesvel/tsup-config';

/**
 * Build configuration for @nesvel/nestjs-storage
 *
 * Uses the NestJS library preset which:
 * - Preserves decorators and metadata (required for NestJS)
 * - Uses TypeScript compiler for proper decorator handling
 * - Outputs both ESM and CJS formats
 * - Generates TypeScript declarations
 */
export default defineConfig(nestLibPreset);
