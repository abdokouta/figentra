/**
 * @file example.module.ts
 * @module {{PACKAGE_NAME}}/modules/example
 * @description Example NestJS domain module. Demonstrates the canonical
 *   module structure:
 *
 *     example.module.ts         — NestJS @Module class (this file, at module root)
 *     controllers/              — HTTP route handlers
 *     services/                 — Business logic (injected into controllers)
 *     interfaces/               — Request/response DTOs + domain interfaces
 *     __tests__/{unit,integration,e2e}/ — Per-module test suites
 *     i18n/{en,ar}/             — Per-module i18n catalogs
 *
 *   Replace this module with your actual domain modules.
 *
 * @security No secrets in module source. Runtime config comes from Doppler.
 */

import { Module } from "@nestjs/common";
import { ExampleController } from "./controllers";
import { ExampleService } from "./services";

@Module({
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService],
})
export class ExampleModule {}
