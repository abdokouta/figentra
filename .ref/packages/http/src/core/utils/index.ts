/**
 * @file index.ts
 * @module @stackra/http/utils
 * @description Utilities barrel.
 */

export { CaseConverter } from "./case-converter.util";
export { DateParser } from "./date-parser.util";
export { composeBaseURL } from "./compose-base-url.util";
export { createLazyHttpClient } from "./create-lazy-http-client.util";
// `getHttpConnectionToken` lives in `@stackra/contracts` as the single
// source of truth — every decorator (`@InjectHttp`) + this module
// import it from contracts directly. Deleted the duplicate local copy
// on 2026-07-27; consumers who used the local barrel entry should
// import from `@stackra/contracts` instead.
export { getHttpConnectionToken } from "@stackra/contracts";
