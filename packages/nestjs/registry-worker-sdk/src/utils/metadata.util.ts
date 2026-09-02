/**
 * @file metadata.util.ts
 * @description Shared reflection metadata utilities for @figentra/registry-worker-sdk decorators.
 *
 * Provides thread-safe append operations to preserve stacked decorators on target classes.
 */

import "reflect-metadata";
import { REGISTRY_DISCOVERY_METADATA } from "../constants/registry.constants";
import type { RegistryDiscoveryRecord } from "../interfaces/registry-discovery.interface";

/**
 * Appends a typed discovery record to the target class constructor's metadata array.
 *
 * @param target - The class constructor being decorated.
 * @param kind - The record kind discriminant.
 * @param value - The typed value for that record kind.
 */
export function appendRegistryRecord(
  target: Function,
  kind: RegistryDiscoveryRecord["kind"],
  value: RegistryDiscoveryRecord["value"],
): void {
  const existing = (Reflect.getMetadata(REGISTRY_DISCOVERY_METADATA, target) ??
    []) as RegistryDiscoveryRecord[];
  Reflect.defineMetadata(
    REGISTRY_DISCOVERY_METADATA,
    [...existing, { kind, value }],
    target,
  );
}
