/**
 * @file index.ts
 * @module @stackra/http/connectors
 * @description Connectors barrel.
 *
 *   Since 1.1.0 both built-in connectors ship from the root entry:
 *
 *   - `FetchConnector` — browser-native + zero-dep, THE default
 *     driver (`driver: "fetch"`).
 *   - `AxiosConnector` — opt-in via `driver: "axios"` + installing
 *     `axios` as a peer dep. Lazy-imports on first use.
 *
 *   Prior to 1.1.0 only `AxiosConnector` was re-exported here + the
 *   fetch driver lived behind `@stackra/http/fetch`. The subpath
 *   still ships for backward compat.
 */
export { AxiosConnector } from "./axios.connector";
export { FetchConnector } from "./fetch.connector";
