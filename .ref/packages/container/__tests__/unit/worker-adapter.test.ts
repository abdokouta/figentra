import { describe, expect, it } from "vitest";
import { Inject, Injectable, Module, REQUEST_SCOPE } from "@/core";
import { WorkerFactory } from "@/worker";
import { WORKER_REQUEST } from "@/worker/worker.tokens";


describe("WorkerFactory", () => {
  it("bridges Cloudflare runtime values into a request-scoped handler", async () => {
    @Injectable({ scope: REQUEST_SCOPE })
    class Handler {
      constructor(@Inject(WORKER_REQUEST) private readonly request: Request) {}

      handle(): Response {
        return new Response(this.request.url);
      }
    }

    @Module({ providers: [Handler], exports: [Handler] })
    class AppModule {}

    const worker = WorkerFactory.create(AppModule, { handler: Handler });
    const executionContext = {
      waitUntil: (_promise: Promise<unknown>) => undefined,
    };

    const response = await worker.fetch(
      new Request("https://example.com/test"),
      {},
      executionContext,
    );

    expect(await response.text()).toBe("https://example.com/test");
  });
});
