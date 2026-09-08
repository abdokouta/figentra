/** Root module; domain modules remain independently replaceable and provider-neutral. */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { LocationController } from './location.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HealthController, LocationController],
})
export class AppModule {}
