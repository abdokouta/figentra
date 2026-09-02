/**
 * @file devtools.factory.ts
 * @description Secure Nest Devtools module factory.
 */
import { DevtoolsModule } from "@nestjs/devtools-integration";
import type { DynamicModule } from "@nestjs/common";

/**
 * Creates Devtools with HTTP introspection disabled by default.
 *
 * @returns Configured Devtools dynamic module.
 */
export const createFigentraDevtoolsModule = (): DynamicModule => DevtoolsModule.register({ http: process.env.NEST_DEVTOOLS_HTTP === "true" });
