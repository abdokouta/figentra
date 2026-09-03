/**
 * @file define-factory.ts
 * @module @stackra/testing/core/factories
 * @description Laravel-shaped fixture builder — accepts a config
 *   object and returns an `IFactory<T>` with `.make` / `.makeMany` /
 *   `.state` / `.with`.
 *
 *   Each factory owns its own `Sequence` (auto-incrementing) and
 *   `Rng` (deterministic). Calling `.state(name)` or `.with(a, b)`
 *   returns a fresh factory locked to those states — the original
 *   factory is never mutated.
 */

import { Rng } from "./rng";
import { Sequence } from "./sequence";
import type {
  FactoryAttributes,
  FactoryState,
  IFactory,
  IFactoryConfig,
} from "./factory.interface";

/**
 * Internal factory implementation. Not exported — consumers reach
 * it via `defineFactory()` which returns the `IFactory<T>` shape.
 */
class Factory<T extends object> implements IFactory<T> {
  private readonly sequence: Sequence;
  private readonly rng: Rng;

  public constructor(
    private readonly attributes: FactoryAttributes<T>,
    private readonly states: Record<string, FactoryState<T>>,
    private readonly afterMake: ((instance: T) => void) | undefined,
    /** State chain to apply on every `.make()` — order matters. */
    private readonly stateChain: readonly string[] = [],
    seed: number = 1,
  ) {
    this.sequence = new Sequence(1);
    this.rng = new Rng(seed);
  }

  public make(overrides: Partial<T> = {}): T {
    const sequence = this.sequence.next();
    const base = this.attributes({ sequence, rng: this.rng });

    // Compose the object step by step so state fns can inspect the
    // draft-so-far via their `draft` argument.
    let draft = { ...base } as T;
    for (const stateName of this.stateChain) {
      const stateFn = this.states[stateName];
      if (!stateFn) {
        throw new Error(
          `[defineFactory] Unknown state '${stateName}'. Known states: ` +
            `${Object.keys(this.states).join(", ") || "(none)"}.`,
        );
      }
      draft = { ...draft, ...stateFn(draft) };
    }

    // Overrides are the final wins.
    const instance = { ...draft, ...overrides } as T;
    this.afterMake?.(instance);
    return instance;
  }

  public makeMany(count: number, overrides: Partial<T> = {}): T[] {
    if (count < 0 || !Number.isInteger(count)) {
      throw new Error(
        `[defineFactory] .makeMany(count) requires a non-negative integer, got ${count}.`,
      );
    }
    const out: T[] = [];
    for (let i = 0; i < count; i++) out.push(this.make(overrides));
    return out;
  }

  public state(name: string): IFactory<T> {
    return this.cloneWithStates([...this.stateChain, name]);
  }

  public with(...names: readonly string[]): IFactory<T> {
    return this.cloneWithStates([...this.stateChain, ...names]);
  }

  public reset(): void {
    this.sequence.reset();
  }

  public reseed(seed: number): void {
    this.rng.reseed(seed);
    this.sequence.reset();
  }

  /**
   * Return a fresh `Factory` sharing this instance's attributes,
   * states, and afterMake hook — but with a fresh state chain.
   *
   * The clone gets its OWN sequence + RNG (both fresh) so
   * `.state()` calls don't share counter state with the parent.
   * That matches Laravel's factory semantics.
   */
  private cloneWithStates(chain: readonly string[]): IFactory<T> {
    return new Factory<T>(
      this.attributes,
      this.states,
      this.afterMake,
      chain,
      this.rng.initialSeed,
    );
  }
}

/**
 * Define a typed factory for `T`.
 *
 * @example
 * ```ts
 * interface Athlete {
 *   id: string;
 *   name: string;
 *   sport: "football" | "basketball";
 * }
 *
 * const AthleteFactory = defineFactory<Athlete>({
 *   attributes: ({ sequence }) => ({
 *     id: `ath_${sequence}`,
 *     name: `Athlete ${sequence}`,
 *     sport: "football",
 *   }),
 *   states: {
 *     basketball: () => ({ sport: "basketball" }),
 *   },
 * });
 *
 * const a = AthleteFactory.make();                    // full athlete
 * const b = AthleteFactory.state("basketball").make();
 * const many = AthleteFactory.makeMany(5);
 * ```
 */
export function defineFactory<T extends object>(
  config: IFactoryConfig<T>,
): IFactory<T> {
  return new Factory<T>(
    config.attributes,
    config.states ?? {},
    config.afterMake,
  );
}
