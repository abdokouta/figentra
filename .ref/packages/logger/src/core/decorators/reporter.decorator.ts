/**
 * @file reporter.decorator.ts
 * @module @stackra/logger/core/decorators
 * @description Decorator that marks a class as a log reporter for auto-discovery.
 *   Classes decorated with @Reporter('name') are automatically registered
 *   with the LoggerManager at boot time.
 */

import { defineMetadata } from '@vivtel/metadata';
import { Injectable } from '@nestjs/common';

/** Metadata key used to identify reporter classes during discovery. */
export const REPORTER_METADATA_KEY = 'stackra:logger:reporter';

/**
 * Marks a class as a log reporter.
 *
 * The LoggerManager discovers all classes decorated with `@Reporter()`
 * during module initialization and registers them by name.
 *
 * @param name - Unique reporter identifier (e.g., 'console', 'json', 'file')
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @Reporter('datadog')
 * @Injectable()
 * export class DatadogReporter implements ILogReporter {
 *   readonly name = 'datadog';
 *   write(entry: ILogEntry): void { ... }
 * }
 * ```
 */
export function Reporter(name: string): ClassDecorator {
  return (target: Function) => {
    Injectable()(target);
    defineMetadata(REPORTER_METADATA_KEY, name, target);
  };
}
