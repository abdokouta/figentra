/**
 * @file index.ts
 * @module @stackra/nestjs-webhook
 * @description Public API barrel for @stackra/nestjs-webhook.
 *
 *   NestJS adapter for @stackra/ts-webhook. Wraps the core module and adds NestJS-specific features (Guards, Interceptors, discovery, health indicators).
 *
 *   ## Architecture
 *
   This package is a thin adapter on top of the core `@stackra/ts-webhook`
   module. The core owns all business logic; this package adds platform-
   specific providers, components, and adapters required for the
   `nestjs` runtime.
 *
 *   ## Usage
 *
 *   @example
 *   ```typescript
 *   import { NestWebhookModule } from '@stackra/nestjs-webhook';
 *
 *   @Module({
 *     imports: [NestWebhookModule.forRoot({})],
 *   })
 *   export class AppModule {}
 *   ```
 *
 *   ## Sections
 *
 *   - **Module** — DI module entrypoint with `forRoot()` and `forFeature()`
 *   - **Services** — injectable services that implement the public contract
 *   - **Decorators** — class/method/property decorators owned by this package
 *   - **Interfaces** — internal interfaces (cross-package types live in `@stackra/contracts`)
 *   - **Types** — internal type aliases
 *   - **Constants** — package-internal constants and DI tokens
 */

// ============================================================================
// Module
// ============================================================================

export { NestWebhookModule } from './nest-webhook.module';

// ============================================================================
// Services
// ============================================================================

// ============================================================================
// Decorators
// ============================================================================

// ============================================================================
// Interfaces
// ============================================================================

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Constants
// ============================================================================
