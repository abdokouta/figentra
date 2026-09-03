import { Scope } from "@stackra/contracts";

/**
 * Request scope value compatible with both current and pre-request-scope
 * versions of @stackra/contracts. Once contracts exposes Scope.REQUEST this
 * resolves to the canonical enum member; otherwise the string fallback keeps
 * the runtime adapter functional for forward-compatible consumers.
 */
export const REQUEST_SCOPE = (
  (Scope as unknown as { REQUEST?: Scope }).REQUEST ?? "REQUEST"
) as Scope;

export function isRequestScope(scope: Scope): boolean {
  return scope === REQUEST_SCOPE || String(scope) === "REQUEST";
}
