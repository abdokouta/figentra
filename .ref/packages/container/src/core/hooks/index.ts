/**
 * @file index.ts
 * @module hooks
 * @description React Hooks Barrel Export
 *
 *   - {@link useContainer} — Access the raw `ContainerResolver` from context
 *   - {@link useInject} — Resolve a provider (throws if not found)
 *   - {@link useOptionalInject} — Resolve a provider (returns `undefined` if not found)
 *   - {@link useDiscovery} — Resolve `DiscoveryService` from the container
 *   - {@link useDiscovered} — Get providers tagged by a discoverable decorator
 */

export { useContainer } from "@/core/hooks/use-container";
export { useInject } from "@/core/hooks/use-inject";
export { useOptionalInject } from "@/core/hooks/use-optional-inject";
export { useDiscovery } from "@/core/hooks/use-discovery";
export { useDiscovered } from "@/core/hooks/use-discovered";
