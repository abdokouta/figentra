import type { Linter } from 'eslint';
import { config as nest } from '@nesvel/eslint-config/nestjs';

/**
 * ESLint configuration array
 *
 * Inherits all NestJS-specific linting rules including:
 * - Repository pattern validation
 * - Entity class standards
 * - Database transaction handling
 * - Migration file conventions
 */
const config: Linter.Config[] = [...nest];

export default config;
