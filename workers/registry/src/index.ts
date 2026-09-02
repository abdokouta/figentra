/**
 * @file index.ts
 * @description Cloudflare Worker entrypoint for the Figentra Application Registry.
 */
import { createRegistry } from './app.js';

/**
 * Default Registry Worker export.
 */
const app = createRegistry();

/** Public exported symbol. */
export default app;
