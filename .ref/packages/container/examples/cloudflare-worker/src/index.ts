import { WorkerFactory } from "@stackra/container/worker";
import { AppModule } from "./app.module";
import { AppHandler } from "./app.handler";

export default WorkerFactory.create(AppModule, {
  handler: AppHandler,
});
