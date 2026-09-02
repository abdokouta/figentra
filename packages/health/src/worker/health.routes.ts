import type { HealthProbe } from "../core/contracts/health.types.js";
import type { HealthServiceContract } from "../core/services/health.service.types.js";
export interface HealthRouteDefinition { readonly method: "GET"; readonly path: string; readonly probe: HealthProbe; }
export interface HealthRouteOptions { readonly path?: string; readonly exposeRoot?: boolean; readonly exposeLiveness?: boolean; readonly exposeReadiness?: boolean; readonly exposeStartup?: boolean; }
export function defineHealthRoutes(options: HealthRouteOptions = {}): readonly HealthRouteDefinition[] {
  const base = (options.path ?? "/health").replace(/\/$/, "");
  const routes: HealthRouteDefinition[] = [];
  if (options.exposeRoot !== false) routes.push({ method: "GET", path: base, probe: "all" });
  if (options.exposeLiveness !== false) routes.push({ method: "GET", path: `${base}/liveness`, probe: "liveness" });
  if (options.exposeReadiness !== false) routes.push({ method: "GET", path: `${base}/readiness`, probe: "readiness" });
  if (options.exposeStartup !== false) routes.push({ method: "GET", path: `${base}/startup`, probe: "startup" });
  return routes;
}
export async function resolveHealthRoute(request: Request, service: HealthServiceContract, routes: readonly HealthRouteDefinition[]): Promise<Response | undefined> {
  if (request.method !== "GET") return undefined;
  const route = routes.find((candidate) => candidate.path === new URL(request.url).pathname);
  if (!route) return undefined;
  const report = await service.check(route.probe);
  return new Response(JSON.stringify(report), { status: report.status === "down" ? 503 : 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
