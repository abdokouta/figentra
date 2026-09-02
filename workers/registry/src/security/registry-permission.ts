import type { Context } from 'hono';
import type { RegistryBindings } from '../interfaces/registry-bindings.interface.js';
import type { RegistryVariables } from '../interfaces/registry-variables.interface.js';
import { REGISTRY_READ_PERMISSION } from '../constants/read-permission.constant.js';

/** Checks the authenticated principal has Registry inventory read access. */
export function canReadRegistry(c: Context<{ Bindings: RegistryBindings; Variables: RegistryVariables }>): boolean {
  const claims = c.get('registryClaims');
  return claims.permissions?.includes(REGISTRY_READ_PERMISSION) ?? false;
}
