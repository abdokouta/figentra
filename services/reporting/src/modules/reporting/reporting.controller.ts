import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('/v1/reporting')
export class ReportingController {
  constructor(private readonly service: ReportingService) {}

  @Post('/query')
  execute(@Body() body: any, @Query('tenantId') tenantId?: string) {
    return this.service.execute(body, tenantId ?? 'request-context-required');
  }

  @Get('/health')
  health() { return { status: 'ok' }; }
}
