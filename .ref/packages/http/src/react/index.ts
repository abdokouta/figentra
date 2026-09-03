/**
 * @file index.ts
 * @module @stackra/http/react
 * @description `@stackra/http/react` — React entry point.
 *
 *   Optional React surface for the HTTP package. Hooks compose
 *   `useInject` from `@stackra/container/react` so they work in
 *   web AND React Native consumers.
 *
 *   Web/native consumers must also import the root `@stackra/http`
 *   to register the module — OR import `WebHttpModule` from this
 *   subpath, which composes `HttpModule.forRoot(config)` plus an
 *   empty widget-scaffold slot for future dashboard contributions.
 */

// ── DI wiring ─────────────────────────────────────────────────────
export { WebHttpModule } from "./web-http.module";

// ── React hooks ───────────────────────────────────────────────────
export {
  useHttp,
  useHttpManager,
  useHttpConnection,
  useStream,
  useSse,
} from "./hooks";
export type { IUseHttpResult, IUseStreamResult, IUseSseResult } from "./hooks";
