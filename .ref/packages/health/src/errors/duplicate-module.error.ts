/**
 * @file duplicate-module.error.ts
 * @module @stackra/nestjs-health/errors
 * @description Error thrown when NestHealthModule.forRoot() is called more than once.
 */

/**
 * Thrown when `NestHealthModule.forRoot()` is called more than once.
 *
 * The health module is a global singleton. Call `forRoot()` once in the root
 * AppModule. Use `forFeature()` in feature modules for indicator registration.
 */
export class DuplicateModuleError extends Error {
  public readonly name = 'DuplicateModuleError';

  public constructor() {
    super(
      'NestHealthModule.forRoot() has already been called. ' +
        'The health module can only be registered once per application. ' +
        'Use NestHealthModule.forFeature() in feature modules to register additional indicators.'
    );
  }
}
