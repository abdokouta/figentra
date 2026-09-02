import "reflect-metadata";
import type { HealthIndicatorMetadata } from "../../core/contracts/health.types.js";
export const HEALTH_INDICATOR_METADATA = Symbol.for("figentra.health.indicator");
export function HealthIndicator(metadata: HealthIndicatorMetadata): ClassDecorator { return (target) => Reflect.defineMetadata(HEALTH_INDICATOR_METADATA, metadata, target); }
export function getHealthIndicatorMetadata(target: object): HealthIndicatorMetadata | undefined { return Reflect.getMetadata(HEALTH_INDICATOR_METADATA, target) as HealthIndicatorMetadata | undefined; }
