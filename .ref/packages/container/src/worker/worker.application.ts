import type { Type } from "@stackra/contracts";
import { Module } from "@/core/decorators/module.decorator";
import { WorkerModule } from "@/worker/worker.module";
import { ApplicationContext } from "@/core/application/application-context.service";
import { ApplicationFactory } from "@/core/application/application.factory";
import type { WorkerFactoryOptions } from "@/worker/interfaces/worker-factory-options.interface";

export class WorkerApplication {
  private bootstrapPromise?: Promise<ApplicationContext>;

  public constructor(
    private readonly rootModule: Type,
    private readonly options: WorkerFactoryOptions,
  ) {}

  public getApplication(): Promise<ApplicationContext> {
    if (!this.bootstrapPromise) {
      const rootModule = this.createWorkerRootModule();
      this.bootstrapPromise = ApplicationFactory.create(rootModule, {
        ...(this.options.application ?? {}),
        debug: false,
        shutdownHooks: false,
        registerGlobal: false,
      }).catch((error) => {
        // Failed bootstrap must be retryable on the next request.
        this.bootstrapPromise = undefined;
        throw error;
      });
    }

    return this.bootstrapPromise;
  }

  /**
   * Compose the consumer's application with the standard Worker runtime
   * module. WorkerModule is global, so all application modules can inject the
   * runtime tokens while WorkerFactory remains the only place that knows the
   * Cloudflare fetch signature.
   */
  private createWorkerRootModule(): Type {
    const applicationRoot = this.rootModule;

    @Module({
      imports: [applicationRoot, WorkerModule],
    })
    class WorkerRootModule {}

    return WorkerRootModule;
  }
}
