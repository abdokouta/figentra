/** Stable HTTP boundary for normalized location operations; provider calls are intentionally deferred to application services. */
import { Body, Controller, Post } from '@nestjs/common';

@Controller('location')
export class LocationController {
  @Post('geocode')
  geocode(@Body() body: { query: string }) {
    return { status: 'not_configured', operation: 'geocode', query: body.query };
  }

  @Post('reverse-geocode')
  reverseGeocode(@Body() body: { latitude: number; longitude: number }) {
    return { status: 'not_configured', operation: 'reverse-geocode', ...body };
  }

  @Post('route')
  route(@Body() body: unknown) {
    return { status: 'not_configured', operation: 'route', request: body };
  }
}
