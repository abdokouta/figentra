import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import type { HealthProbe } from "../../core/contracts/health.types.js";
import type { HealthServiceContract } from "../../core/services/health.service.types.js";
interface NestResponse { status(code: number): NestResponse; }
export interface HealthControllerOptions { readonly path: string; }
export function defineHealthController(service: HealthServiceContract, options: HealthControllerOptions): new () => object {
  @Controller(options.path.replace(/^\/+|\/+$/g, ""))
  class HealthController {
    @Get() async all(@Res({ passthrough: true }) response: NestResponse) { return this.respond("all", response); }
    @Get("liveness") async liveness(@Res({ passthrough: true }) response: NestResponse) { return this.respond("liveness", response); }
    @Get("readiness") async readiness(@Res({ passthrough: true }) response: NestResponse) { return this.respond("readiness", response); }
    @Get("startup") async startup(@Res({ passthrough: true }) response: NestResponse) { return this.respond("startup", response); }
    private async respond(probe: HealthProbe, response: NestResponse) {
      const report = await service.check(probe);
      response.status(report.status === "down" ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK);
      return report;
    }
  }
  return HealthController;
}
