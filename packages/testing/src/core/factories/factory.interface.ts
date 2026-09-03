/**
 * @file factory.interface.ts
 * @module @stackra/testing/core/factories
 * @description Public interfaces for the factory system —
 *   Laravel-shaped fixture builders with sequences, states, and
 *   deterministic RNG.
 *
 *   `IFactory<T>` is the shape `defineFactory<T>({...})` returns.
 *   `IFactoryConfig<T>` is what the author passes in.
 *
 *   Every method returns `T` or `T[]` — never `Partial<T>` — so
 *   downstream code can be typed without null-checks.
 */

/**
 * Function producing the base attribute set for a factory.
 *
 * Receives the current invocation `sequence` (auto-incrementing)
 * and the deterministic RNG so authors can produce
 * reproducibility across runs.
 */
export type FactoryAttributes<T> = (context: {
  readonly sequence: number;
  readonly rng: { next(): number; int(min: number, max: number): number };
}) => Partial<T>;

/**
 * Function producing a state-specific override set. Runs AFTER
 * the base attributes so authors can compose:
 *
 * ```ts
 * const AthleteFactory = defineFactory<Athlete>({
 *   attributes: ({ sequence }) => ({ name: `Athlete ${sequence}` }),
 *   states: {
 *     minor: () => ({ dateOfBirth: "2015-01-01" }),
 *     injured: (draft) => ({ status: "injured", team: draft.team }),
 *   },
 * });
 * ```
 */
export type FactoryState<T> = (draft: T) => Partial<T>;

/** Author-facing config passed to `defineFactory`. */
export interface IFactoryConfig<T> {
  /** Base attributes — evaluated every `.make()` invocation. */
  attributes: FactoryAttributes<T>;

  /**
   * Named state overrides. Compose via `.state("name")` or
   * `.with("a", "b")` (multiple states in order).
   */
  states?: Record<string, FactoryState<T>>;

  /**
   * Hook fired AFTER the object is fully assembled. Useful for
   * setting up back-references, calling `.freeze()`, etc.
   */
  afterMake?: (instance: T) => void;
}

/** The runtime factory returned by `defineFactory`. */
export interface IFactory<T> {
  /** Build one instance; merge any explicit overrides on top. */
  make(overrides?: Partial<T>): T;

  /** Build N instances; each call is a fresh invocation. */
  makeMany(count: number, overrides?: Partial<T>): T[];

  /**
   * Return a new factory locked to state `name`. Non-mutating —
   * the original factory keeps its default states.
   */
  state(name: string): IFactory<T>;

  /**
   * Return a new factory locked to a chain of states applied in
   * order. Non-mutating.
   */
  with(...names: readonly string[]): IFactory<T>;

  /** Reset the internal sequence to 1. */
  reset(): void;

  /**
   * Reseed the deterministic RNG. Same seed → same output
   * across runs, useful for snapshot tests.
   */
  reseed(seed: number): void;
}
