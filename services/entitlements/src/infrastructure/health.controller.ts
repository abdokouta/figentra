/**
 * @file health.controller.ts
 * @description Liveness and readiness endpoints for the service runtime.
 * @remarks Liveness never checks downstream dependencies. Readiness is the
 *   extension point for dependency checks owned by the service.
 */
import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

/** Exposes platform health contracts used by load balancers and orchestrators. */
@Controller("health")
export class HealthController {
  /** Returns success when the Node/Nest process is alive. */
  @Get("live")
  @HttpCode(HttpStatus.OK)
  public live(): { status: "ok" } {
    return { status: "ok" };
  }

  /** Returns success when the application composition is ready to receive traffic. */
  @Get("ready")
  @HttpCode(HttpStatus.OK)
  public ready(): { status: "ok" } {
    return { status: "ok" };
  }
}
