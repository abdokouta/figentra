/**
 * @file app.module.ts
 * @module {{PACKAGE_NAME}}
 * @description Root NestJS module for the {{SLUG}} service. Composes every
 *   domain module under `src/modules/`. The health module is generated
 *   dynamically by the framework — no static health controller needed.
 *
 *   Add new domain modules to the `imports` array as the service grows.
 */

import { Module } from "@nestjs/common";
import { ExampleModule } from "./modules";

@Module({
  imports: [
    // ── Domain modules ────────────────────────────────────────────────
    ExampleModule,

    // Add more domain modules here as the service grows:
    // OrdersModule,
    // UsersModule,
  ],
})
export class AppModule {}
