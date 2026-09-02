/**
 * @file multiple-instance-manager.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for the `MultipleInstanceManager<T>`
 *   base — the N-named-connections pattern behind CacheManager,
 *   QueueManager, HttpManager, StorageManager, etc.
 */

import { describe, expect, it, vi } from "vitest";
import { MultipleInstanceManager } from "../../src/managers/multiple-instance-manager";

interface ICacheStore {
  readonly name: string;
  read(key: string): unknown;
}

class TestCacheManager extends MultipleInstanceManager<ICacheStore> {
  public constructor(
    private defaultName: string,
    private stores: Record<string, Record<string, unknown>>,
  ) {
    super();
  }

  public getDefaultInstance(): string {
    return this.defaultName;
  }

  public setDefaultInstance(name: string): void {
    this.defaultName = name;
  }

  public getInstanceConfig(name: string): Record<string, unknown> | null {
    return this.stores[name] ?? null;
  }

  protected createMemoryDriver(config: Record<string, unknown>): ICacheStore {
    return {
      name: `memory:${config.namespace ?? "default"}`,
      read: () => undefined,
    };
  }

  protected createRedisDriver(config: Record<string, unknown>): ICacheStore {
    return { name: `redis:${config.host}`, read: () => undefined };
  }
}

describe("MultipleInstanceManager — resolution", () => {
  it("instance() returns the default when no name is given", () => {
    const mgr = new TestCacheManager("memory", {
      memory: { driver: "memory", namespace: "app" },
    });
    const store = mgr.instance();
    expect(store.name).toBe("memory:app");
  });

  it("instance(name) returns the named instance", () => {
    const mgr = new TestCacheManager("memory", {
      memory: { driver: "memory", namespace: "primary" },
      redis: { driver: "redis", host: "prod.example.com" },
    });
    expect(mgr.instance("redis").name).toBe("redis:prod.example.com");
    expect(mgr.instance("memory").name).toBe("memory:primary");
  });

  it("instance() caches — subsequent calls return the same reference", () => {
    const mgr = new TestCacheManager("memory", {
      memory: { driver: "memory" },
    });
    const first = mgr.instance();
    const second = mgr.instance();
    expect(first).toBe(second);
  });

  it("throws when the instance config is missing", () => {
    const mgr = new TestCacheManager("memory", {});
    expect(() => mgr.instance("nonexistent")).toThrow(
      /Instance \[nonexistent\] is not defined/,
    );
  });

  it("throws when the instance config doesn't specify the driver key", () => {
    const mgr = new TestCacheManager("memory", {
      memory: { host: "localhost" }, // missing `driver`
    });
    expect(() => mgr.instance("memory")).toThrow(/does not specify a driver/);
  });

  it("throws when the driver name is not supported", () => {
    const mgr = new TestCacheManager("memory", {
      memory: { driver: "unknown" },
    });
    expect(() => mgr.instance("memory")).toThrow(
      /Instance driver \[unknown\] is not supported/,
    );
  });
});

describe("MultipleInstanceManager — extend / cache", () => {
  it("extend(driverName, creator) registers a custom driver", () => {
    const mgr = new TestCacheManager("dynamo", {
      dynamo: { driver: "dynamodb", tableName: "sessions" },
    });
    const creator = vi
      .fn()
      .mockImplementation((config: Record<string, unknown>) => ({
        name: `dynamo:${config.tableName}`,
        read: () => undefined,
      }));
    mgr.extend("dynamodb", creator);

    const inst = mgr.instance("dynamo");
    expect(inst.name).toBe("dynamo:sessions");
    expect(creator).toHaveBeenCalledOnce();
  });

  it("hasInstance() reports whether the instance is currently cached", () => {
    const mgr = new TestCacheManager("memory", {
      memory: { driver: "memory" },
    });
    expect(mgr.hasInstance("memory")).toBe(false);
    mgr.instance("memory");
    expect(mgr.hasInstance("memory")).toBe(true);
  });

  it("getResolvedInstances() returns the names of currently-cached instances", () => {
    const mgr = new TestCacheManager("memory", {
      memory: { driver: "memory" },
      redis: { driver: "redis", host: "localhost" },
    });
    mgr.instance("memory");
    expect(mgr.getResolvedInstances()).toEqual(["memory"]);
    mgr.instance("redis");
    expect(mgr.getResolvedInstances().sort()).toEqual(["memory", "redis"]);
  });

  it("forgetInstance(name) drops the named instance", () => {
    const mgr = new TestCacheManager("memory", {
      memory: { driver: "memory" },
      redis: { driver: "redis", host: "h" },
    });
    const first = mgr.instance("memory");
    mgr.forgetInstance("memory");
    expect(mgr.hasInstance("memory")).toBe(false);
    expect(mgr.instance("memory")).not.toBe(first);
  });

  it("forgetInstance() with no arg drops the default instance", () => {
    const mgr = new TestCacheManager("memory", {
      memory: { driver: "memory" },
    });
    mgr.instance();
    mgr.forgetInstance();
    expect(mgr.hasInstance()).toBe(false);
  });

  it("forgetInstance(array) drops many at once", () => {
    const mgr = new TestCacheManager("memory", {
      memory: { driver: "memory" },
      redis: { driver: "redis", host: "h" },
    });
    mgr.instance("memory");
    mgr.instance("redis");
    mgr.forgetInstance(["memory", "redis"]);
    expect(mgr.getResolvedInstances()).toEqual([]);
  });

  it("purge(name) is an alias for forgetInstance(name)", () => {
    const mgr = new TestCacheManager("memory", {
      memory: { driver: "memory" },
    });
    mgr.instance("memory");
    mgr.purge("memory");
    expect(mgr.hasInstance("memory")).toBe(false);
  });
});

describe("MultipleInstanceManager — async resolution", () => {
  it("instanceAsync() resolves an async custom creator", async () => {
    const mgr = new TestCacheManager("s3", {
      s3: { driver: "s3", bucket: "assets" },
    });
    mgr.extend("s3", async (config) => ({
      name: `s3:${config.bucket}`,
      read: () => undefined,
    }));

    const inst = await mgr.instanceAsync("s3");
    expect(inst.name).toBe("s3:assets");
  });

  it("instanceAsync() caches — subsequent calls return the same reference", async () => {
    const mgr = new TestCacheManager("s3", { s3: { driver: "s3" } });
    mgr.extend("s3", async () => ({ name: "s3", read: () => undefined }));
    const first = await mgr.instanceAsync("s3");
    const second = await mgr.instanceAsync("s3");
    expect(first).toBe(second);
  });

  it("instanceAsync() shares its cache with the sync instance()", async () => {
    const mgr = new TestCacheManager("memory", {
      memory: { driver: "memory" },
    });
    const syncInst = mgr.instance("memory");
    const asyncInst = await mgr.instanceAsync("memory");
    expect(syncInst).toBe(asyncInst);
  });
});
