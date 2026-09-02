/**
 * @file devtools.module.ts
 * @description Global Nest Devtools module.
 */
import { Global, Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import { createFigentraDevtoolsModule } from "./devtools.factory";

/** Provides secure development diagnostics. */
@Global()
@Module({})
/** Public symbol `FigentraDevtoolsModule`. */
export class FigentraDevtoolsModule {
  /** Creates the configured Devtools module. */
  static register(): DynamicModule {
    return { module: FigentraDevtoolsModule, imports: [createFigentraDevtoolsModule()] };
  }
}
