/**
 * Unit tests for module imports and cross-module resolution.
 *
 * Tests: Module imports, exports, re-exports, global modules, dynamic modules
 *
 * @module __tests__/unit/module-imports
 */

import { describe, it, expect } from "vitest";

import { Injectable } from "@/core/decorators/injectable.decorator";
import { Module } from "@/core/decorators/module.decorator";
import { Global } from "@/core/decorators/global.decorator";
import { Inject } from "@/core/decorators/inject.decorator";
import { ApplicationFactory } from "@/core/application/application.factory";
import type { DynamicModule } from "@stackra/contracts";

describe("Module Imports", () => {
  describe("Basic imports", () => {
    it("should resolve providers from imported modules", async () => {
      @Injectable()
      class SharedService {
        getValue() {
          return "shared";
        }
      }

      @Module({ providers: [SharedService], exports: [SharedService] })
      class SharedModule {}

      @Injectable()
      class ConsumerService {
        constructor(public shared: SharedService) {}
      }

      @Module({ imports: [SharedModule], providers: [ConsumerService] })
      class ConsumerModule {}

      const app = await ApplicationFactory.create(ConsumerModule);
      const consumer = app.get(ConsumerService);

      expect(consumer.shared).toBeInstanceOf(SharedService);
      expect(consumer.shared.getValue()).toBe("shared");
    });

    it("should not resolve non-exported providers from imported modules", async () => {
      @Injectable()
      class InternalService {}

      @Module({ providers: [InternalService] })
      class InternalModule {}

      @Injectable()
      class ConsumerService {
        constructor(public internal: InternalService) {}
      }

      @Module({ imports: [InternalModule], providers: [ConsumerService] })
      class ConsumerModule {}

      await expect(ApplicationFactory.create(ConsumerModule)).rejects.toThrow();
    });
  });

  describe("Global modules", () => {
    it("should make providers available without explicit import", async () => {
      @Injectable()
      class GlobalService {
        getValue() {
          return "global";
        }
      }

      @Global()
      @Module({ providers: [GlobalService], exports: [GlobalService] })
      class GlobalModule {}

      @Injectable()
      class LeafService {
        constructor(public global: GlobalService) {}
      }

      @Module({ providers: [LeafService] })
      class LeafModule {}

      @Module({ imports: [GlobalModule, LeafModule] })
      class RootModule {}

      const app = await ApplicationFactory.create(RootModule);
      const leaf = app.get(LeafService);

      expect(leaf.global).toBeInstanceOf(GlobalService);
      expect(leaf.global.getValue()).toBe("global");
    });
  });

  describe("Dynamic modules", () => {
    it("should support forRoot() pattern with dynamic module", async () => {
      const CONFIG_TOKEN = Symbol("CONFIG");

      @Injectable()
      class ConfigurableService {
        constructor(@Inject(CONFIG_TOKEN) public config: any) {}
      }

      @Module({})
      class ConfigurableModule {
        static forRoot(config: Record<string, any>): DynamicModule {
          return {
            module: ConfigurableModule,
            providers: [
              { provide: CONFIG_TOKEN, useValue: config },
              ConfigurableService,
            ],
            exports: [ConfigurableService],
          };
        }
      }

      @Module({
        imports: [ConfigurableModule.forRoot({ apiUrl: "https://api.test" })],
      })
      class AppModule {}

      const app = await ApplicationFactory.create(AppModule);
      const service = app.get(ConfigurableService);

      expect(service.config).toEqual({ apiUrl: "https://api.test" });
    });

    it("should support global dynamic modules", async () => {
      const TOKEN = Symbol("DYNAMIC_GLOBAL");

      @Module({})
      class DynamicGlobalModule {
        static forRoot(): DynamicModule {
          return {
            module: DynamicGlobalModule,
            global: true,
            providers: [{ provide: TOKEN, useValue: "dynamic-global" }],
            exports: [TOKEN],
          };
        }
      }

      @Injectable()
      class LeafService {
        constructor(@Inject(TOKEN) public value: string) {}
      }

      @Module({ providers: [LeafService] })
      class LeafModule {}

      @Module({ imports: [DynamicGlobalModule.forRoot(), LeafModule] })
      class RootModule {}

      const app = await ApplicationFactory.create(RootModule);
      const leaf = app.get(LeafService);

      expect(leaf.value).toBe("dynamic-global");
    });

    // Regression — the DFS scanner visits imports depth-first. When
    // `forFeature(...)` for a module is visited BEFORE `forRoot()`
    // for the same module (e.g. because a consumer package's
    // `forRoot()` composes `X.forFeature(...)` in its imports, and
    // that consumer is listed before the app's `X.forRoot()`), the
    // container used to merge providers correctly but silently drop
    // the `global: true` from the later `forRoot()` — because
    // `isGlobalModule` was checked ONLY on the first insertion.
    //
    // Symptom: providers from `forRoot()` are present in the module
    // but `bindGlobalScope()` doesn't link the module to consumers,
    // so any registrar from `forFeature(...)` that injects a
    // `forRoot()`-provided class fails DI resolution with "Provider
    // 'X' not found. Is it provided in the current module or an
    // imported module?".
    //
    // This test locks the invariant: `global: true` on ANY
    // contribution to a module upgrades it to global scope,
    // regardless of DFS visit order.
    it("upgrades a module to global when a later contribution declares global:true (DFS-order regression)", async () => {
      const REGISTRY_TOKEN = Symbol.for("STATE_REGISTRY");

      @Injectable()
      class StateRegistry {
        public readonly stores: string[] = [];
        public register(name: string): void {
          this.stores.push(name);
        }
      }

      @Injectable()
      class StoreIndexRegistrar {
        public constructor(public readonly registry: StateRegistry) {}
      }

      // The "core" module — a single class that ships both forRoot
      // (with `global: true`) and forFeature (adds a registrar).
      @Module({})
      class StateModule {
        static forRoot(): DynamicModule {
          return {
            module: StateModule,
            global: true,
            providers: [
              { provide: StateRegistry, useClass: StateRegistry },
              { provide: REGISTRY_TOKEN, useExisting: StateRegistry },
            ],
            exports: [StateRegistry, REGISTRY_TOKEN],
          };
        }
        static forFeature(): DynamicModule {
          return {
            module: StateModule,
            providers: [StoreIndexRegistrar],
            exports: [StoreIndexRegistrar],
          };
        }
      }

      // Consumer module — lists `forFeature` FIRST in its imports
      // so the DFS visits the feature contribution before the root.
      @Module({})
      class ConsumerModule {
        static forRoot(): DynamicModule {
          return {
            module: ConsumerModule,
            imports: [StateModule.forFeature()],
            exports: [],
          };
        }
      }

      // App root — ConsumerModule.forRoot() (which imports
      // StateModule.forFeature()) is listed BEFORE
      // StateModule.forRoot(). DFS visits StateModule via
      // ConsumerModule first (no `global: true` on that
      // contribution), then via the app root (with `global: true`).
      // The second visit MUST upgrade StateModule to global.
      @Module({
        imports: [ConsumerModule.forRoot(), StateModule.forRoot()],
      })
      class AppModule {}

      const app = await ApplicationFactory.create(AppModule);
      const registrar = app.get(StoreIndexRegistrar);
      expect(registrar).toBeInstanceOf(StoreIndexRegistrar);
      expect(registrar.registry).toBeInstanceOf(StateRegistry);
    });
  });

  describe("Re-exports", () => {
    it("should support re-exporting imported modules", async () => {
      @Injectable()
      class BaseService {
        getValue() {
          return "base";
        }
      }

      @Module({ providers: [BaseService], exports: [BaseService] })
      class BaseModule {}

      // MiddleModule imports and re-exports BaseModule
      @Module({ imports: [BaseModule], exports: [BaseModule] })
      class MiddleModule {}

      @Injectable()
      class TopService {
        constructor(public base: BaseService) {}
      }

      @Module({ imports: [MiddleModule], providers: [TopService] })
      class TopModule {}

      const app = await ApplicationFactory.create(TopModule);
      const top = app.get(TopService);

      expect(top.base).toBeInstanceOf(BaseService);
    });
  });

  describe("Class-token duplication (bundle-duplication regression)", () => {
    // In pnpm-based monorepos, a package's class token can appear
    // TWICE in a bundled app when the same package resolves via two
    // different transitive paths (peer-dep permutations, chunk
    // splitting). The class NAMES match but the function references
    // are distinct — `A !== B` — so exact-identity `providers.has()`
    // fails at DI resolve time even though a functionally-equivalent
    // provider exists in scope.
    //
    // This test simulates the shape: two same-named `Foo` classes,
    // one bound as a provider, another used as the constructor type
    // dependency of a consumer. The class-name fallback in
    // `lookupProvider` finds the exported provider by matching
    // `token.name` on same-named function tokens.
    it("resolves class-token dep even when consumer sees a duplicate class reference", async () => {
      // Provider-side class — the one actually bound by the module.
      @Injectable()
      class Foo {
        public readonly value = "provider";
      }

      // "Duplicate" class — same name, different function object.
      // Mimics what pnpm + bundler chunk splitting produces when the
      // same source file lands in two chunks.
      const FooDuplicate = (function makeFoo() {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        class Foo {
          public readonly value = "duplicate";
        }
        return Foo;
      })();

      // Sanity check — names match, references don't.
      expect(FooDuplicate.name).toBe("Foo");
      expect(FooDuplicate).not.toBe(Foo);

      // Consumer declares its constructor param typed as the
      // DUPLICATE class. The container should still resolve via the
      // provider registered under the original class.
      @Injectable()
      class Consumer {
        public constructor(@Inject(FooDuplicate) public readonly foo: Foo) {}
      }

      @Module({ providers: [Foo], exports: [Foo] })
      class ProviderModule {}

      @Module({ imports: [ProviderModule], providers: [Consumer] })
      class ConsumerModule {}

      const app = await ApplicationFactory.create(ConsumerModule);
      const consumer = app.get(Consumer);
      expect(consumer.foo).toBeInstanceOf(Foo);
      expect(consumer.foo.value).toBe("provider");
    });

    it("still fails when a same-named class exists but is NOT exported", async () => {
      @Injectable()
      class Foo {
        public readonly value = "internal";
      }

      // Same-name duplicate, used as the consumer's inject token.
      const FooDuplicate = (function () {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        class Foo {}
        return Foo;
      })();

      @Injectable()
      class Consumer {
        public constructor(@Inject(FooDuplicate) public readonly foo: Foo) {}
      }

      // ProviderModule has Foo but does NOT export it.
      @Module({ providers: [Foo] })
      class ProviderModule {}

      @Module({ imports: [ProviderModule], providers: [Consumer] })
      class ConsumerModule {}

      await expect(ApplicationFactory.create(ConsumerModule)).rejects.toThrow();
    });
  });
});
