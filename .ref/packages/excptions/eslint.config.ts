import type { Linter } from 'eslint';
import { config as nest } from '@nesvel/eslint-config/nestjs';

/**
 * ESLint configuration array
 *
 * Inherits all NestJS-specific linting rules including:
 * - Message broker patterns
 * - Publish/subscribe decorator usage
 * - Event-driven architecture standards
 * - Message serialization conventions
 */
const config: Linter.Config[] = [...nest];

export default config;
