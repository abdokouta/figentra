import { defineConfig } from 'tsup';
import { nestLibPreset } from '@nesvel/tsup-config';

/**
 * Build configuration for @nesvel/nestjs-mail
 *
 * Uses the React library preset with multiple entry points:
 * - Main index for all exports
 * - Separate DIRoutes component for direct import
 */
export default defineConfig({
  ...nestLibPreset,
  bundle: true, // Bundle to avoid missing module errors
});
