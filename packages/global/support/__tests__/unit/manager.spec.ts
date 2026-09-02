/**
 * @file manager.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for the abstract `Manager<T>` base —
 *   the single-active-driver pattern behind LoggerManager,
 *   BroadcastManager, AuthManager, etc.
 */

import { describe, expect, it, vi } from "vitest";
import { Manager } from "../../src/managers/manager";

interface IChannel {
  readonly name: string;
  emit(message: string): void;
}

/** Test-only concrete Manager. */
class ChannelManager extends Manager<IChannel> {
  public defaultDriver = "console";

  public getDefaultDriver(): string {
    return this.defaultDriver;
  }

  protected createConsoleDriver(): IChannel {
    return { name: "console", emit: () => undefined };
  }

  protected createJsonDriver(): IChannel {
    return { name: "json", emit: () => undefined };
  }
}

describe("Manager — resolution", () => {
  it("driver() returns the default driver when no name is given", () => {
    const mgr = new ChannelManager();
    const driver = mgr.driver();
    expect(driver.name).toBe("console");
  });

  it("driver(name) returns the named driver", () => {
    const mgr = new ChannelManager();
    const json = mgr.driver("json");
    expect(json.name).toBe("json");
  });

  it("driver() caches resolved instances — subsequent calls return the same reference", () => {
    const mgr = new ChannelManager();
    const first = mgr.driver("console");
    const second = mgr.driver("console");
    expect(first).toBe(second);
  });

  it("throws when the driver name is not supported", () => {
    const mgr = new ChannelManager();
    expect(() => mgr.driver("unknown")).toThrow(
      /Driver \[unknown\] is not supported/,
    );
  });

  it("throws when the default driver resolves to a falsy value", () => {
    class Bad extends ChannelManager {
      public override getDefaultDriver(): string {
        return "";
      }
    }
    const mgr = new Bad();
    expect(() => mgr.driver()).toThrow(/Unable to resolve NULL driver/);
  });
});

describe("Manager — extend / custom creator", () => {
  it("extend(name, creator) registers a custom driver", () => {
    const mgr = new ChannelManager();
    const creator = vi
      .fn()
      .mockReturnValue({ name: "datadog", emit: () => undefined });
    mgr.extend("datadog", creator);

    const dd = mgr.driver("datadog");
    expect(dd.name).toBe("datadog");
    expect(creator).toHaveBeenCalledOnce();
  });

  it("custom creators take priority over convention-based drivers", () => {
    const mgr = new ChannelManager();
    // Override built-in `console` with a custom creator.
    mgr.extend("console", () => ({
      name: "custom-console",
      emit: () => undefined,
    }));
    // Since we didn't call driver('console') before extend, no cache
    // yet — the extend takes effect on the next resolve.
    expect(mgr.driver("console").name).toBe("custom-console");
  });

  it("extend returns `this` for chaining", () => {
    const mgr = new ChannelManager();
    expect(mgr.extend("a", () => ({}) as IChannel)).toBe(mgr);
  });
});

describe("Manager — cache management", () => {
  it("getDrivers() returns the resolved instances map", () => {
    const mgr = new ChannelManager();
    mgr.driver("console");
    mgr.driver("json");
    const map = mgr.getDrivers();
    expect(map.size).toBe(2);
    expect(map.has("console")).toBe(true);
    expect(map.has("json")).toBe(true);
  });

  it("forgetDrivers() clears the cache — next call re-creates", () => {
    const mgr = new ChannelManager();
    const first = mgr.driver("console");
    mgr.forgetDrivers();
    const second = mgr.driver("console");
    expect(first).not.toBe(second);
  });

  it("forgetDriver(name) clears a single cached driver", () => {
    const mgr = new ChannelManager();
    const console1 = mgr.driver("console");
    const json1 = mgr.driver("json");
    mgr.forgetDriver("console");
    expect(mgr.driver("console")).not.toBe(console1);
    // Untouched driver stays cached.
    expect(mgr.driver("json")).toBe(json1);
  });
});
