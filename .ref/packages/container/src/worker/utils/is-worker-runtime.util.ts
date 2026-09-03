export function isWorkerRuntime(): boolean {
  // Cloudflare Workers expose fetch/Request/Response/crypto but do not expose
  // Node's process object. Keep this intentionally conservative: adapters
  // should normally be selected explicitly through the /worker subpath.
  return typeof globalThis !== "undefined" &&
    typeof globalThis.fetch === "function" &&
    typeof globalThis.Request === "function" &&
    typeof globalThis.Response === "function";
}
