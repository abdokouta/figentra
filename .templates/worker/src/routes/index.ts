/**
 * @file index.ts
 * @module {{PACKAGE_NAME}}/routes
 * @description Route barrel. Re-exports every route handler so `src/index.ts`
 *   can wire them into the fetch router.
 */

export { handleHealth } from "./health";
export { handleExample } from "./example";
