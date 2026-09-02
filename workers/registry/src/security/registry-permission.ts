/**
 * @file registry-permission.ts
 * @description Authorization helper functions for Registry inventory access.
 */

import type { Context } from "hono";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface";
import type { RegistryVariables } from "../interfaces/registry-variables.interface";
import { REGISTRY_READ_PERMISSION } from "../constants/read-permission.constant";

/**
 * Checks whether the authenticated principal carries the registry:read permission.
 *
 * @param c - Hono request context containing verified registryClaims.
 * @returns True if principal is authorized to read registry metadata.
 */
export function canReadRegistry(
  c: Context<{ Bindings: RegistryBindings; Variables: RegistryVariables }>,
): boolean {
  const claims = c.get("registryClaims");
  return claims.permissions?.includes(REGISTRY_READ_PERMISSION) ?? false;
}
