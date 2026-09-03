import type { Linter } from 'eslint';
import { config as nest } from '@nesvel/eslint-config/nestjs';

/**
 * ESLint configuration array
 *
 * Inherits all NestJS-specific linting rules including:
 * - Storage driver interface implementations
 * - File upload handling patterns
 * - Stream processing standards
 * - Provider-specific configurations
 */
const config: Linter.Config[] = [...nest];

export default config;
