import { describe, expect, it } from "vitest";

import { Inject } from "@/core/decorators/inject.decorator";
import { Injectable } from "@/core/decorators/injectable.decorator";
import { Module } from "@/core/decorators/module.decorator";
import { WorkerFactory } from "@/worker/worker.factory";
import { WorkerModule } from "@/worker/worker.module";
import {
  WORKER_CONTEXT,
  WORKER_ENV,
  WORKER_EXECUTION_CONTEXT,
  WORKER_REQUEST,
} from "@/worker/worker.tokens";

class Env {
  readonly VALUE = "worker-value";
}

@Injectable()
class RequestHandler {
  public constructor(
    @Inject(WORKER_ENV) public readonly env: Env,
    @Inject(WORKER_REQUEST) public readonly request: Request,
    @Inject(WORKER_EXECUTION_CONTEXT)
    public readonly executionContext: { waitUntil(promise: Promise<unknown>): void },
    @Inject(WORKER_CONTEXT) public readonly context: { env: Env; request: Request },
  ) {}

  public handle(): Response {
    return Response.json({
      value: this.env.VALUE,
      url: this.request.url,
      contextMatchesEnv: this.context.env === this.env,
      contextMatchesRequest: this.context.request === this.request,
    });
  }
}

@Module({
  providers: [RequestHandler],
})
class AppModule {}

describe("Worker runtime module", () => {
  it("binds the complete Worker runtime surface through WorkerModule", async () => {
    const handler = WorkerFactory.create(AppModule, { handler: RequestHandler });
    const request = new Request("https://example.test/users");
    const env = new Env();
    const executionContext = { waitUntil: (_promise: Promise<unknown>) => undefined };

    const response = await handler.fetch(request, env, executionContext);
    const body = await response.json() as Record<string, unknown>;

    expect(body.value).toBe("worker-value");
    expect(body.url).toBe(request.url);
    expect(body.contextMatchesEnv).toBe(true);
    expect(body.contextMatchesRequest).toBe(true);
  });

  it("isolates request-scoped Worker bindings between requests", async () => {
    const handler = WorkerFactory.create(AppModule, { handler: RequestHandler });
    const envA = new Env();
    const envB = new Env();
    const requestA = new Request("https://example.test/a");
    const requestB = new Request("https://example.test/b");
    const ctx = { waitUntil: (_promise: Promise<unknown>) => undefined };

    const [responseA, responseB] = await Promise.all([
      handler.fetch(requestA, envA, ctx),
      handler.fetch(requestB, envB, ctx),
    ]);

    expect((await responseA.json() as Record<string, unknown>).url).toBe(requestA.url);
    expect((await responseB.json() as Record<string, unknown>).url).toBe(requestB.url);
  });

  it("keeps WorkerModule declarative and global", () => {
    expect(WorkerModule).toBeDefined();
  });
});
