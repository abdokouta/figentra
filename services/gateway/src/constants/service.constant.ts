/** @file service.constant.ts @description Canonical Gateway service identity. */
export const SERVICE_PACKAGE_NAME = "@figentra/gateway";
export const SERVICE_NAME = "gateway";
export const SERVICE_VERSION = "0.0.1";
export const SERVICE_IDENTITY = Object.freeze({ name: SERVICE_NAME, packageName: SERVICE_PACKAGE_NAME, version: SERVICE_VERSION } as const);
