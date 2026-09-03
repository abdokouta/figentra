import { describe, expect, it } from "vitest";
import { Inject, Injectable, Module, REQUEST_SCOPE } from "@/core";
import { ApplicationFactory } from "@/core/application/application.factory";
import { WORKER_ENV } from "@/worker/worker.tokens";


describe("Request scope", () => {
  it("creates one request-scoped instance per request context", async () => {
    @Injectable({ scope: REQUEST_SCOPE })
    class RequestService {
      public readonly id = Math.random();
    }

    @Module({ providers: [RequestService], exports: [RequestService] })
    class TestModule {}

    const app = await ApplicationFactory.create(TestModule, {
      shutdownHooks: false,
      registerGlobal: false,
    });

    const first = app.createRequestContext();
    const second = app.createRequestContext();

    const a1 = await first.get(RequestService);
    const a2 = await first.get(RequestService);
    const b1 = await second.get(RequestService);

    expect(a1).toBe(a2);
    expect(a1).not.toBe(b1);

    await first.close();
    await second.close();
    await app.close();
  });

  it("injects runtime values without registering them in the module graph", async () => {
    @Injectable({ scope: REQUEST_SCOPE })
    class RequestService {
      public constructor(@Inject(WORKER_ENV) public readonly env: { value: string }) {}
    }

    @Module({ providers: [RequestService], exports: [RequestService] })
    class TestModule {}

    const app = await ApplicationFactory.create(TestModule, {
      shutdownHooks: false,
      registerGlobal: false,
    });

    const context = app.createRequestContext([[WORKER_ENV, { value: "ok" }]]);
    const service = await context.get(RequestService);

    expect(service.env.value).toBe("ok");
    expect(context.has(WORKER_ENV)).toBe(true);
    expect(app.has(WORKER_ENV)).toBe(false);

    await context.close();
    await app.close();
  });
});
