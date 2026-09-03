/**
 * @file index.ts
 * @module {{PACKAGE_NAME}}/modules/example
 * @description Public API barrel for the example module.
 */

export { ExampleModule } from "./example.module";
export { ExampleService } from "./services";
export type {
  IExampleResponse,
  ICreateExampleRequest,
  IUpdateExampleRequest,
} from "./interfaces";
