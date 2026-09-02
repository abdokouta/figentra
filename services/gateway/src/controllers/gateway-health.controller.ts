/**
 * @file gateway-health.controller.ts
 * @description Terminus-backed dependency readiness for the Gateway.
 */
import { Controller, Get, Inject } from "@nestjs/common";
import { GATEWAY_CONFIG } from "../modules/gateway.config.module.js";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import type { GatewayConfig } from "../config/gateway.config.js";
import { Public } from "../guards/authentication.guard.js";

/** Performs bounded health checks against Gateway-critical control-plane dependencies. */
@Controller("health")
export class GatewayHealthController {
  /** Creates the readiness controller. */
  public constructor(private readonly health: HealthCheckService, @Inject(GATEWAY_CONFIG) private readonly config: GatewayConfig) {}

  /** Returns process health without dependency checks. */
  @Get("live")
  @Public()
  public live(): { status: "ok" } { return { status: "ok" }; }

  /** Checks Identity, IAM and Registry readiness before accepting traffic. */
  @Get("ready")
  @Public()
  @HealthCheck()
  public async ready(): Promise<unknown> {
    return this.health.check([
      () => this.check("identity", `${this.config.identityServiceUrl}/api/health/ready`),
      () => this.check("iam", `${this.config.iamServiceUrl}/api/health/ready`),
      () => this.check("registry", `${this.config.registryServiceUrl}/api/health/ready`),
    ]);
  }

  /** Executes a bounded dependency probe and returns a Terminus-compatible result. */
  private async check(name: string, url: string): Promise<Record<string, { status: "up" | "down" }>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(this.config.upstreamTimeoutMs, 3000));
    try {
      const response = await fetch(url, { method: "GET", signal: controller.signal, headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`${name} returned ${response.status}`);
      return { [name]: { status: "up" } };
    } catch {
      return { [name]: { status: "down" } };
    } finally {
      clearTimeout(timer);
    }
  }
}
