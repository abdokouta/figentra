/** Minimal liveness/readiness surface; infrastructure health checks can be added without changing the public domain API. */
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  live() {
    return { status: 'ok', service: 'location' };
  }

  @Get('ready')
  ready() {
    return { status: 'ready', service: 'location' };
  }
}
