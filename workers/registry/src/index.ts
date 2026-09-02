/**
 * @file index.ts
 * @description Main entrypoint exporting the configured Cloudflare Worker application.
 */

import { createRegistry } from "./app";

const app = createRegistry();

export default app;
