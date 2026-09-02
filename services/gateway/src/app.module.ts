/** @file app.module.ts @description Figentra Gateway composition root. */
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { GatewayModule } from "./modules/gateway.module";
import { RequestContextMiddleware } from "./middleware/request-context.middleware";
import { SecurityMiddleware } from "./middleware/security.middleware";
import { CorsMiddleware } from "./middleware/cors.middleware";

/** Root module applying deterministic middleware ordering. */
@Module({ imports: [GatewayModule] })
export class AppModule implements NestModule {
  /** Applies request context, security headers and explicit CORS policy. */
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware, SecurityMiddleware, CorsMiddleware).forRoutes({ path: "*path", method: RequestMethod.ALL });
  }
}
