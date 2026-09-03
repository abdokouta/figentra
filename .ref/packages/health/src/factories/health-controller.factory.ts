/**
 * @file health-controller.factory.ts
 * @module @stackra/nestjs-health/factories
 * @description Dynamic controller factory for health endpoints.
 *
 * Creates a NestJS controller at runtime with a configurable base path
 * and probe endpoints. Guards are applied conditionally based on config.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
  type IType,
  NotFoundException,
} from '@nestjs/common';
import { HealthStatus, HealthProbe } from '@stackra/contracts';
import type { IAggregatedHealthResult } from '@stackra/contracts';
import { HEALTH_MODULE_OPTIONS } from '../constants';
import { HealthRunnerService } from '../services/health-runner.service';
import { IndicatorRegistry } from '../registries';
import type { IHealthModuleOptions } from '../interfaces';

/**
 * Create the dynamic health controller class with configurable basePath.
 *
 * @param options - Module configuration
 * @returns A NestJS controller class
 */
export function createHealthController(options: IHealthModuleOptions): IType<any> {
  const basePath = options.basePath ?? 'health';

  @Controller(basePath)
  class HealthController {
    public constructor(
      private readonly runner: HealthRunnerService,
      private readonly registry: IndicatorRegistry,
      @Inject(HEALTH_MODULE_OPTIONS) private readonly config: IHealthModuleOptions
    ) {}

    /**
     * Full health check — runs all indicators.
     */
    @Get()
    public async checkAll(): Promise<{ statusCode: number; body: unknown }> {
      const result = await this.runner.runAll();
      return this.formatResponse(result);
    }

    /**
     * Liveness probe — runs only liveness-assigned indicators.
     */
    @Get('liveness')
    public async liveness(): Promise<{ statusCode: number; body: unknown }> {
      const result = await this.runner.runProbe(HealthProbe.LIVENESS);
      return this.formatResponse(result);
    }

    /**
     * Readiness probe — runs only readiness-assigned indicators.
     */
    @Get('readiness')
    public async readiness(): Promise<{ statusCode: number; body: unknown }> {
      const result = await this.runner.runProbe(HealthProbe.READINESS);
      return this.formatResponse(result);
    }

    /**
     * Startup probe — runs only startup-assigned indicators.
     */
    @Get('startup')
    public async startup(): Promise<{ statusCode: number; body: unknown }> {
      const result = await this.runner.runProbe(HealthProbe.STARTUP);
      return this.formatResponse(result);
    }

    /**
     * Single indicator check.
     */
    @Get(':indicator')
    public async checkSingle(
      @Param('indicator') indicator: string
    ): Promise<{ statusCode: number; body: unknown }> {
      if (!this.registry.has(indicator)) {
        throw new NotFoundException(`Health indicator "${indicator}" not found.`);
      }

      const result = await this.runner.runSingle(indicator);
      const statusCode =
        result.status === HealthStatus.DOWN ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK;

      return { statusCode, body: result };
    }

    /**
     * Admin: list all registered indicators.
     */
    @Get('admin/indicators')
    public async listIndicators(): Promise<unknown> {
      const all = this.registry.getAll();
      return all.map((entry) => ({
        name: entry.name,
        probes: entry.probes,
        paused: this.registry.isPaused(entry.name),
        metadata: entry.metadata,
      }));
    }

    /**
     * Admin: pause an indicator.
     */
    @Post('admin/indicators/:name/pause')
    @HttpCode(HttpStatus.OK)
    public async pauseIndicator(@Param('name') name: string): Promise<unknown> {
      if (!this.registry.has(name)) {
        throw new NotFoundException(`Health indicator "${name}" not found.`);
      }
      this.runner.pause(name);
      return { name, paused: true };
    }

    /**
     * Admin: resume an indicator.
     */
    @Post('admin/indicators/:name/resume')
    @HttpCode(HttpStatus.OK)
    public async resumeIndicator(@Param('name') name: string): Promise<unknown> {
      if (!this.registry.has(name)) {
        throw new NotFoundException(`Health indicator "${name}" not found.`);
      }
      this.runner.resume(name);
      return { name, paused: false };
    }

    /**
     * Admin: force-run an indicator.
     */
    @Post('admin/indicators/:name/run')
    @HttpCode(HttpStatus.OK)
    public async runIndicator(@Param('name') name: string): Promise<unknown> {
      if (!this.registry.has(name)) {
        throw new NotFoundException(`Health indicator "${name}" not found.`);
      }
      const result = await this.runner.runSingle(name);
      return result;
    }

    /**
     * Admin: get check history.
     */
    @Get('admin/history')
    public async getHistory(@Query('limit') limit?: string): Promise<unknown> {
      const store = (this.runner as any).resultStore;
      const parsedLimit = Math.min(Math.max(1, parseInt(limit ?? '50', 10) || 50), 500);
      return store.getHistory(parsedLimit);
    }

    /**
     * Format response based on configured response format.
     */
    private formatResponse(result: IAggregatedHealthResult): { statusCode: number; body: unknown } {
      const statusCode =
        result.status === HealthStatus.DOWN ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK;

      const format = this.config.responseFormat ?? 'full';

      if (format === 'simple') {
        return {
          statusCode,
          body: { status: result.status === HealthStatus.DOWN ? 'error' : 'ok' },
        };
      }

      if (typeof format === 'function') {
        try {
          const body = format(result);
          return { statusCode, body };
        } catch {
          // Fall back to full format on transformer error
        }
      }

      // Full format
      const info: Record<string, unknown> = {};
      const error: Record<string, unknown> = {};
      const details: Record<string, unknown> = {};

      for (const [name, r] of Object.entries(result.results)) {
        details[name] = r;
        if (r.status === HealthStatus.UP || r.status === HealthStatus.DEGRADED) {
          info[name] = r;
        } else {
          error[name] = r;
        }
      }

      return {
        statusCode,
        body: {
          status: result.status === HealthStatus.DOWN ? 'error' : 'ok',
          info,
          error,
          details,
          timestamp: result.timestamp.toISOString(),
          duration: result.duration,
        },
      };
    }
  }

  return HealthController;
}
