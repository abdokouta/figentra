/**
 * @file index.ts
 * @module {{PACKAGE_NAME}}/modules/example/interfaces
 * @description Barrel re-exporting every interface in the example module.
 */

export type {
  IExampleResponse,
  ICreateExampleRequest,
  IUpdateExampleRequest,
} from "./example.interface";
