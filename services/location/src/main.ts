/** Boots the standalone Location service HTTP runtime. */
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.setGlobalPrefix('v1');
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3010, '0.0.0.0');
}

void bootstrap();
