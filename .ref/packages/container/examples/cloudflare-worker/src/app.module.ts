import { Module } from "@stackra/container";
import { AppHandler } from "./app.handler";
import { HealthService } from "./health.service";

@Module({
  providers: [AppHandler, HealthService],
  exports: [AppHandler],
})
export class AppModule {}
