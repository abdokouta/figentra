import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('/v1/search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Post()
  search(@Body() body: any, @Query('tenantId') tenantId?: string) {
    return this.service.search(body, tenantId ?? 'request-context-required');
  }

  @Post('/autocomplete')
  autocomplete(@Body() body: { prefix: string; resourceTypes?: string[] }, @Query('tenantId') tenantId?: string) {
    return this.service.autocomplete(body.prefix, body.resourceTypes, tenantId ?? 'request-context-required');
  }

  @Post('/suggest')
  suggest(@Body() body: { input: string }, @Query('tenantId') tenantId?: string) {
    return this.service.suggest(body.input, tenantId ?? 'request-context-required');
  }

  @Get('/health')
  health() { return { status: 'ok' }; }
}
