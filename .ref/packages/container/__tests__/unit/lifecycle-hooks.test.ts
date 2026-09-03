/**
 * Unit tests for lifecycle hook execution order.
 *
 * Tests: onModuleInit, onApplicationBootstrap, shutdown hooks
 *
 * @module __tests__/unit/lifecycle-hooks
 */

import { describe, it, expect, afterEach, vi } from "vitest";

import { ApplicationFactory } from "@/core/application/application.factory";
import { clearGlobalApplicationContext } from "@/core/utils/global-application.util";
import { Injectable } from "@/core/decorators/injectable.decorator";
import { Module } from "@/core/decorators/module.decorator";
import { ModuleRef } from "@/core/container/module-ref";

describe("Lifecycle Hooks", () => {
  afterEach(() => {
    clearGlobalApplicationContext();
  });

  describe("onModuleInit", () => {
    it("calls onModuleInit on providers that implement it", async () => {
      const initFn = vi.fn();

      @Injectable()
      class InitService {
        onModuleInit() {
          initFn();
        }
      }

      @Module({ providers: [InitService] })
      class TestModule {}

      const app = await ApplicationFactory.create(TestModule);
      expect(initFn).toHaveBeenCalledOnce();
      await app.close();
    });

    it("awaits async onModuleInit hooks", async () => {
      const order: string[] = [];

      @Injectable()
      class AsyncInitService {
        async onModuleInit() {
          await new Promise((r) => setTimeout(r, 10));
          order.push("async-init");
        }
      }

      @Injectable()
      class SyncInitService {
        onModuleInit() {
          order.push("sync-init");
        }
      }

      @Module({ providers: [AsyncInitService, SyncInitService] })
      class TestModule {}

      const app = await ApplicationFactory.create(TestModule);
      expect(order).toContain("async-init");
      expect(order).toContain("sync-init");
      await app.close();
    });
  });

  describe("onApplicationBootstrap", () => {
    it("calls onApplicationBootstrap after all onModuleInit hooks", async () => {
      const order: string[] = [];

      @Injectable()
      class BootstrapService {
        onModuleInit() {
          order.push("init");
        }
        onApplicationBootstrap() {
          order.push("bootstrap");
        }
      }

      @Module({ providers: [BootstrapService] })
      class TestModule {}

      const app = await ApplicationFactory.create(TestModule);
      expect(order).toEqual(["init", "bootstrap"]);
      await app.close();
    });

    // Regression — a registry that seeds built-in handlers in its
    // OWN `onModuleInit` via `ModuleRef.get(HandlerClass)`. Real
    // consumer: `@stackra/actions` ActionRegistry. Requires
    // `isInitialized === true` at phase 2, which is why the loader
    // flips the flag at the end of phase 1 (before ANY lifecycle
    // hooks fire).
    it("allows ModuleRef.get(...) inside onModuleInit (phase 2)", async () => {
      @Injectable()
      class BuiltInHandler {
        public readonly kind = "built-in";
      }

      let resolvedInInit: BuiltInHandler | null = null;

      @Injectable()
      class HandlerRegistry {
        public constructor(private readonly moduleRef: ModuleRef) {}
        onModuleInit() {
          resolvedInInit = this.moduleRef.get<BuiltInHandler>(BuiltInHandler);
        }
      }

      @Module({ providers: [BuiltInHandler, HandlerRegistry] })
      class TestModule {}

      const app = await ApplicationFactory.create(TestModule);
      expect(resolvedInInit).toBeInstanceOf(BuiltInHandler);
      expect(resolvedInInit!.kind).toBe("built-in");
      await app.close();
    });

    // Regression — codifies ADR-0052 §Canonical shape. A `forFeature`
    // registrar class implements `onApplicationBootstrap` and uses
    // `ModuleRef.get(Cls)` to resolve consumer-supplied classes.
    it("allows ModuleRef.get(...) inside onApplicationBootstrap (ADR-0052)", async () => {
      @Injectable()
      class TargetService {
        public readonly name = "target";
      }

      let resolvedInsideHook: TargetService | null = null;

      @Injectable()
      class Registrar {
        public constructor(private readonly moduleRef: ModuleRef) {}
        onApplicationBootstrap() {
          resolvedInsideHook = this.moduleRef.get<TargetService>(TargetService);
        }
      }

      @Module({ providers: [TargetService, Registrar] })
      class TestModule {}

      const app = await ApplicationFactory.create(TestModule);
      expect(resolvedInsideHook).toBeInstanceOf(TargetService);
      expect(resolvedInsideHook!.name).toBe("target");
      await app.close();
    });
  });

  describe("shutdown hooks", () => {
    it("calls beforeApplicationShutdown with signal", async () => {
      const shutdownFn = vi.fn();

      @Injectable()
      class ShutdownService {
        beforeApplicationShutdown(signal?: string) {
          shutdownFn(signal);
        }
      }

      @Module({ providers: [ShutdownService] })
      class TestModule {}

      const app = await ApplicationFactory.create(TestModule);
      await app.close("SIGTERM");
      expect(shutdownFn).toHaveBeenCalledWith("SIGTERM");
    });

    it("calls onApplicationShutdown with signal", async () => {
      const shutdownFn = vi.fn();

      @Injectable()
      class ShutdownService {
        onApplicationShutdown(signal?: string) {
          shutdownFn(signal);
        }
      }

      @Module({ providers: [ShutdownService] })
      class TestModule {}

      const app = await ApplicationFactory.create(TestModule);
      await app.close("SIGINT");
      expect(shutdownFn).toHaveBeenCalledWith("SIGINT");
    });

    it("calls onModuleDestroy during shutdown", async () => {
      const destroyFn = vi.fn();

      @Injectable()
      class DestroyService {
        onModuleDestroy() {
          destroyFn();
        }
      }

      @Module({ providers: [DestroyService] })
      class TestModule {}

      const app = await ApplicationFactory.create(TestModule);
      await app.close();
      expect(destroyFn).toHaveBeenCalledOnce();
    });

    it("calls shutdown hooks in reverse module order", async () => {
      const order: string[] = [];

      @Injectable()
      class ChildService {
        onModuleDestroy() {
          order.push("child");
        }
      }

      @Module({ providers: [ChildService], exports: [ChildService] })
      class ChildModule {}

      @Injectable()
      class ParentService {
        onModuleDestroy() {
          order.push("parent");
        }
      }

      @Module({ imports: [ChildModule], providers: [ParentService] })
      class ParentModule {}

      const app = await ApplicationFactory.create(ParentModule);
      await app.close();

      // Child module (higher distance) should be destroyed before parent (lower distance)
      const childIdx = order.indexOf("child");
      const parentIdx = order.indexOf("parent");
      expect(childIdx).toBeLessThan(parentIdx);
    });

    it("executes all three shutdown phases in order", async () => {
      const order: string[] = [];

      @Injectable()
      class FullLifecycleService {
        beforeApplicationShutdown() {
          order.push("before");
        }
        onApplicationShutdown() {
          order.push("shutdown");
        }
        onModuleDestroy() {
          order.push("destroy");
        }
      }

      @Module({ providers: [FullLifecycleService] })
      class TestModule {}

      const app = await ApplicationFactory.create(TestModule);
      await app.close();
      expect(order).toEqual(["before", "shutdown", "destroy"]);
    });
  });

  describe("init hooks execution order across modules", () => {
    it("calls onModuleInit in breadth-first order (root first)", async () => {
      const order: string[] = [];

      @Injectable()
      class LeafService {
        onModuleInit() {
          order.push("leaf");
        }
      }

      @Module({ providers: [LeafService], exports: [LeafService] })
      class LeafModule {}

      @Injectable()
      class RootService {
        onModuleInit() {
          order.push("root");
        }
      }

      @Module({ imports: [LeafModule], providers: [RootService] })
      class RootModule {}

      const app = await ApplicationFactory.create(RootModule);

      // Root module (distance 0) should init before leaf (distance 1)
      const rootIdx = order.indexOf("root");
      const leafIdx = order.indexOf("leaf");
      expect(rootIdx).toBeLessThan(leafIdx);
      await app.close();
    });
  });
});
