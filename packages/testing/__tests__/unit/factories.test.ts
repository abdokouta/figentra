/**
 * @file factories.test.ts
 * @module @stackra/testing/__tests__/unit
 * @description Unit tests for `defineFactory` — the Laravel-shaped
 *   fixture builder. Covers `.make()`, `.makeMany()`, sequence
 *   auto-increment, override precedence, state application,
 *   multi-state composition via `.with(...)`, unknown-state errors,
 *   `.reset()`, `.reseed()`, and the `afterMake` hook.
 */

import { describe, expect, it } from "vitest";

import { defineFactory } from "@/core/factories";

interface IAthlete {
  id: string;
  name: string;
  sport: "football" | "basketball" | "swimming";
  age: number;
}

const AthleteFactory = defineFactory<IAthlete>({
  attributes: ({ sequence }) => ({
    id: `ath_${sequence}`,
    name: `Athlete ${sequence}`,
    sport: "football",
    age: 10,
  }),
  states: {
    basketball: () => ({ sport: "basketball" }),
    swimming: () => ({ sport: "swimming" }),
    senior: () => ({ age: 21 }),
  },
});

describe("defineFactory", () => {
  // ── .make() ───────────────────────────────────────────────────

  describe(".make()", () => {
    it("produces a full instance from the base attributes", () => {
      const a = AthleteFactory.make();
      expect(a).toEqual({
        id: "ath_1",
        name: "Athlete 1",
        sport: "football",
        age: 10,
      });
    });

    it("auto-increments the sequence per invocation", () => {
      const seed = defineFactory<IAthlete>({
        attributes: ({ sequence }) => ({
          id: `x_${sequence}`,
          name: `n${sequence}`,
          sport: "football",
          age: 10,
        }),
      });

      expect(seed.make().id).toBe("x_1");
      expect(seed.make().id).toBe("x_2");
      expect(seed.make().id).toBe("x_3");
    });

    it("overrides win over base attributes", () => {
      const a = AthleteFactory.make({ name: "Custom Ada", age: 42 });
      expect(a.name).toBe("Custom Ada");
      expect(a.age).toBe(42);
      // Untouched base attributes are preserved.
      expect(a.sport).toBe("football");
    });
  });

  // ── .makeMany() ───────────────────────────────────────────────

  describe(".makeMany()", () => {
    it("produces the requested count of distinct instances", () => {
      const seed = defineFactory<IAthlete>({
        attributes: ({ sequence }) => ({
          id: `x_${sequence}`,
          name: `n${sequence}`,
          sport: "football",
          age: 10,
        }),
      });
      const list = seed.makeMany(3);
      expect(list).toHaveLength(3);
      expect(list.map((a) => a.id)).toEqual(["x_1", "x_2", "x_3"]);
    });

    it("returns an empty array for count=0", () => {
      const seed = defineFactory<IAthlete>({
        attributes: ({ sequence }) => ({
          id: `x_${sequence}`,
          name: "n",
          sport: "football",
          age: 1,
        }),
      });
      expect(seed.makeMany(0)).toEqual([]);
    });

    it("applies the shared override to every instance", () => {
      const seed = defineFactory<IAthlete>({
        attributes: ({ sequence }) => ({
          id: `x_${sequence}`,
          name: "n",
          sport: "football",
          age: 10,
        }),
      });
      const list = seed.makeMany(3, { age: 99 });
      expect(list.every((a) => a.age === 99)).toBe(true);
    });

    it("throws on negative counts", () => {
      const seed = defineFactory<IAthlete>({
        attributes: () => ({}),
      });
      expect(() => seed.makeMany(-1)).toThrow(/non-negative integer/);
    });

    it("throws on non-integer counts", () => {
      const seed = defineFactory<IAthlete>({
        attributes: () => ({}),
      });
      expect(() => seed.makeMany(2.5)).toThrow(/non-negative integer/);
    });
  });

  // ── .state() ──────────────────────────────────────────────────

  describe(".state()", () => {
    it("applies the state override on top of the base", () => {
      const bball = AthleteFactory.state("basketball").make();
      expect(bball.sport).toBe("basketball");
      expect(bball.name).toBe("Athlete 1");
    });

    it("returns a fresh factory — original is not mutated", () => {
      const bball = AthleteFactory.state("basketball");
      // Original still produces football.
      const first = AthleteFactory.make();
      const second = bball.make();

      expect(first.sport).toBe("football");
      expect(second.sport).toBe("basketball");
    });

    it("throws when the state name is unknown", () => {
      // Error surfaces at .make() time (states are resolved lazily).
      expect(() => AthleteFactory.state("unknown").make()).toThrow(/Unknown state 'unknown'/);
    });

    it("names known states in the error message", () => {
      expect(() => AthleteFactory.state("unknown").make()).toThrow(/basketball, swimming, senior/);
    });

    it("says '(none)' when no states are declared", () => {
      const bare = defineFactory<IAthlete>({
        attributes: () => ({
          id: "x",
          name: "y",
          sport: "football",
          age: 1,
        }),
      });
      expect(() => bare.state("anything").make()).toThrow(/\(none\)/);
    });
  });

  // ── .with(...) ────────────────────────────────────────────────

  describe(".with(...)", () => {
    it("composes multiple states in application order", () => {
      const senior = AthleteFactory.with("basketball", "senior").make();
      expect(senior.sport).toBe("basketball");
      expect(senior.age).toBe(21);
    });

    it("later state wins on conflicting fields (left-to-right compose)", () => {
      const factory = defineFactory<IAthlete>({
        attributes: () => ({
          id: "x",
          name: "y",
          sport: "football",
          age: 10,
        }),
        states: {
          bball: () => ({ sport: "basketball" }),
          swim: () => ({ sport: "swimming" }),
        },
      });

      // `swim` applied AFTER `bball` — its value wins.
      expect(factory.with("bball", "swim").make().sport).toBe("swimming");
      // Reversed order — `bball` wins.
      expect(factory.with("swim", "bball").make().sport).toBe("basketball");
    });
  });

  // ── Override precedence ───────────────────────────────────────

  describe("override precedence", () => {
    it("explicit overrides win over states, which win over base", () => {
      const result = AthleteFactory.with("basketball", "senior").make({
        sport: "swimming",
      });
      expect(result.sport).toBe("swimming"); // override
      expect(result.age).toBe(21); // state
      expect(result.name).toBe("Athlete 1"); // base
    });
  });

  // ── .reset() ──────────────────────────────────────────────────

  describe(".reset()", () => {
    it("resets the internal sequence back to 1", () => {
      const seed = defineFactory<IAthlete>({
        attributes: ({ sequence }) => ({
          id: `x_${sequence}`,
          name: "n",
          sport: "football",
          age: 1,
        }),
      });
      seed.make();
      seed.make();
      seed.make();
      seed.reset();
      expect(seed.make().id).toBe("x_1");
    });
  });

  // ── .reseed(seed) ─────────────────────────────────────────────

  describe(".reseed()", () => {
    it("changes RNG output deterministically", () => {
      const factory = defineFactory<{ n: number }>({
        attributes: ({ rng }) => ({ n: rng.int(0, 1_000_000) }),
      });
      factory.reseed(42);
      const first = factory.make().n;
      factory.reseed(42);
      const second = factory.make().n;
      expect(first).toBe(second);

      factory.reseed(99);
      const third = factory.make().n;
      expect(third).not.toBe(first);
    });

    it("also resets the sequence", () => {
      const factory = defineFactory<{ s: number }>({
        attributes: ({ sequence }) => ({ s: sequence }),
      });
      factory.make();
      factory.make();

      factory.reseed(42);
      expect(factory.make().s).toBe(1);
    });
  });

  // ── afterMake hook ────────────────────────────────────────────

  describe("afterMake hook", () => {
    it("fires once per made instance with the assembled object", () => {
      const seen: IAthlete[] = [];
      const factory = defineFactory<IAthlete>({
        attributes: ({ sequence }) => ({
          id: `x_${sequence}`,
          name: "n",
          sport: "football",
          age: 1,
        }),
        afterMake: (instance) => {
          seen.push(instance);
        },
      });

      const one = factory.make();
      const many = factory.makeMany(2);

      expect(seen).toHaveLength(3);
      expect(seen[0]).toBe(one);
      expect(seen[1]).toBe(many[0]);
      expect(seen[2]).toBe(many[1]);
    });

    it("sees the FINAL object (overrides + states already merged)", () => {
      let captured: IAthlete | undefined;
      const factory = defineFactory<IAthlete>({
        attributes: () => ({
          id: "x",
          name: "n",
          sport: "football",
          age: 1,
        }),
        states: { senior: () => ({ age: 30 }) },
        afterMake: (instance) => {
          captured = instance;
        },
      });

      factory.state("senior").make({ name: "override" });

      expect(captured?.name).toBe("override");
      expect(captured?.age).toBe(30);
    });
  });

  // ── State fn receives draft ───────────────────────────────────

  describe("state fn receives the draft-so-far", () => {
    it("can read prior fields when computing overrides", () => {
      const factory = defineFactory<{ base: number; doubled: number }>({
        attributes: () => ({ base: 5, doubled: 0 }),
        states: {
          double: (draft) => ({ doubled: draft.base * 2 }),
        },
      });

      expect(factory.state("double").make().doubled).toBe(10);
    });
  });
});
