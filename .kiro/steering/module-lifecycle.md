# Module Lifecycle & Bootstrap Rules

## Rule — no "bootstrap provider" classes

**Forbidden pattern:**

```typescript
// ❌ ANTI-PATTERN — do NOT copy this
@Injectable()
class SomethingBootstrap {
  public constructor(registry: SomeRegistry, config: SomeConfig) {
    // Work happening inside a constructor to force eager side effects.
    for (const entry of config.entries) registry.register(entry);
  }
}

@Module({})
export class SomeModule {
  static forRoot(options): DynamicModule {
    return {
      providers: [
        SomeRegistry,
        {
          provide: SOMETHING_BOOTSTRAP, // synthetic token that exists
          useFactory: (r) => new Bootstrap(r, options), // only to run this
          inject: [SomeRegistry], // side effect at container-init
        },
      ],
    };
  }
}
```

**Why this is wrong:**

- Conflates _construction_ with _activation_. A constructor should wire
  dependencies into fields, not perform work.
- Requires a synthetic marker token (`X_BOOTSTRAP`) whose only purpose is to
  force the container to instantiate the provider. That token adds API surface
  with no consumer value.
- Sidesteps the container's lifecycle contract — every other package uses
  `onModuleInit` / `onApplicationBootstrap` for post-wire setup, making one
  package a special case.
- Harder to test — you can't call `registry.populate()` in isolation because the
  population lives inside an unrelated class.

## Rule — use lifecycle hooks

The container provides two hooks. Pick the one that matches your intent and
implement it directly on the service that owns the state.

### `OnModuleInit` — module-local initialisation

Fires when the container instantiates the module's providers. Use this when a
service needs to seed its own state from its own config.

```typescript
// ✅ CORRECT — the registry owns its config and its population.
@Injectable()
class SomeRegistry implements OnModuleInit {
  public constructor(
    @Inject(SOME_CONFIG) private readonly config: SomeConfig,
    @Optional()
    @Inject(LOGGER_MANAGER)
    private readonly logger?: ILoggerManager,
  ) {}

  public onModuleInit(): void {
    for (const entry of this.config.entries ?? []) {
      this.register(entry);
    }
  }

  public register(entry: Entry): void {
    /* … */
  }
}
```

### `OnApplicationBootstrap` — cross-module coordination

Fires _after_ every module has finished `onModuleInit`. Use this when your work
depends on other modules already having initialised (e.g. discovery scanning a
fully-populated container).

```typescript
// ✅ CORRECT — discovery runs after all modules have wired their providers.
@Injectable()
class RouteDiscovery implements OnApplicationBootstrap {
  public constructor(
    private readonly routes: RouteRegistry,
    @Optional()
    @Inject(DISCOVERY_SERVICE)
    private readonly discovery?: IDiscoveryService,
  ) {}

  public onApplicationBootstrap(): void {
    if (!this.discovery) return;
    for (const provider of this.discovery.getProvidersByMetadata(
      ROUTE_METADATA_KEY,
    )) {
      // …
    }
  }
}
```

## Rule — module `forRoot(...)` returns providers only

`forRoot(...)` should list:

- The registry / service classes themselves.
- Their `useExisting` aliases against tokens.
- A `useValue` config provider (or `useFactory` for async).

Nothing else. **Do not add a marker class whose only job is to force eager side
effects.**

```typescript
// ✅ CORRECT — ADR-0063 canonical shape. Options bind AS-IS via
// `useValue`. Services apply `??` fallbacks inline against
// `DEFAULT_SOME_CONFIG` when reading optional fields. Framework
// defaults live in `config/<pkg>.config.ts` (registerAs factory);
// apps override via `mergeAs("<namespace>", () => ({...}))`.
@Module({})
export class SomeModule {
  static forRoot(options?: SomeModuleOptions): DynamicModule {
    return {
      module: SomeModule,
      global: true,
      providers: [
        // Static path — bind options AS-IS. No merge step.
        ...(options !== undefined
          ? [{ provide: SOME_CONFIG, useValue: options }]
          : []),
        SomeRegistry,
        { provide: SOME_REGISTRY, useExisting: SomeRegistry },
        SomeResolver,
        { provide: SOME_RESOLVER, useExisting: SomeResolver },
      ],
      exports: [
        SOME_CONFIG,
        SomeRegistry,
        SOME_REGISTRY,
        SomeResolver,
        SOME_RESOLVER,
      ],
    };
  }
}
```

## Rule — `forFeature(...)` uses lifecycle hooks too

> **ADR anchor.** Codified by
> [ADR-0052](../../docs/adr/0052-forfeature-registrar-class-pattern.md).

Feature modules also avoid the bootstrap-class pattern. Each `forFeature` call
declares a small `@Injectable()` "registrar" class INSIDE the method body that
extends the existing registry via `onApplicationBootstrap` (cross-module
coordination — the base registry lives in another module):

```typescript
// ✅ CORRECT — an inline @Injectable() registrar class.
public static forFeature(options: IXFeatureOptions): DynamicModule {
  @Injectable()
  class XFeatureRegistrar implements OnApplicationBootstrap {
    public constructor(
      private readonly registry: SomeRegistry,
    ) {}
    public onApplicationBootstrap(): void {
      for (const entry of options.entries ?? []) {
        this.registry.register(entry, "feature");
      }
    }
  }

  return {
    module: XModule,
    providers: [XFeatureRegistrar],
  };
}
```

Each call to `forFeature` creates a fresh class object — the container tracks
providers by class identity, so multiple contributions never collide.

### `forFeature(...)` seeding — use an `@Injectable()` registrar class

The **wrong** way to seed from `forFeature` is a `useFactory` that runs a side
effect — regardless of whether the factory returns a sentinel (`return true`,
`return null`) or a lifecycle-hook object. Both are `useFactory`-for-side-
effect. `useFactory` is documented (NestJS custom-providers) to produce the
VALUE consumed under the token; nothing here ever injects that token.

```typescript
// ❌ ANTI-PATTERN — synthetic token, useFactory doing side effects.
{
  provide: Symbol('SEED'),
  useFactory: (registry) => { seed(registry, options); return true; },
  inject: [Registry],
}
```

**Correct — an inline `@Injectable()` class implementing
`OnApplicationBootstrap`, registered as a bare class provider.** The container
instantiates the class, resolves its constructor deps through standard DI, and
invokes its `onApplicationBootstrap` hook after every module's `onModuleInit` —
the right phase for cross-module seeding:

```typescript
// ✅ CORRECT — a real @Injectable() registrar class.
public static forFeature(options: IXFeatureOptions): DynamicModule {
  @Injectable()
  class XFeatureRegistrar implements OnApplicationBootstrap {
    public constructor(private readonly registry: Registry) {}

    public onApplicationBootstrap(): void {
      for (const entry of options.entries ?? []) {
        this.registry.register(entry, 'feature');
      }
    }
  }

  return {
    module: XModule,
    providers: [XFeatureRegistrar],
  };
}
```

Two properties matter:

1. **Each `forFeature` call creates a fresh registrar class.** Multiple
   contributions never collide — the container tracks providers by class
   identity, and each call produces a distinct class object.
2. **Seeding is a lifecycle hook on a real class, not a factory side effect.**
   Runs after every module's `onModuleInit`, alongside discovery. See ADR-0052
   for the canonical shape per `forFeature` variant (driver+class,
   `Type<X> | Type<X>[]`, driver+factory, options).

### When a consumer class is passed to `forFeature`

Registrars that receive a class from the consumer (`forFeature(driver, Cls)` or
`forFeature(Type<X> | Type<X>[])`) resolve the instance through
`ModuleRef.get(Cls)` inside `onApplicationBootstrap`. The class is added to the
returned `DynamicModule.providers` so the container instantiates it before the
registrar's hook runs. Guard for `null` (fail-soft):

```typescript
@Injectable()
class CacheStoreRegistrar implements OnApplicationBootstrap {
  public constructor(
    @Inject(CACHE_MANAGER) private readonly manager: CacheManager,
    private readonly moduleRef: ModuleRef,
  ) {}

  public onApplicationBootstrap(): void {
    for (const [driver, StoreClass] of entries) {
      const store = this.moduleRef.get<ICacheStore>(StoreClass);
      if (store) this.manager.extend(driver, () => store);
    }
  }
}
```

Registrars that operate on closure-captured factories (like `storage`'s
`(config) => IStorage`) don't need `ModuleRef` — the factory is captured in
scope directly.

### Legacy `createSeedLoader` pattern (retired 2026-07-28)

Before ADR-0052, `forFeature` seeding routed through `createSeedLoader(fn)` +
`seedLoaderToken(name)` from `@stackra/support`. Session 3 of the ADR-0052
rollout landed on 2026-07-28: every package migrated to the registrar-class
shape above, the helpers were deleted from `@stackra/support`, and
`@stackra/csp` dropped its back-compat re-export in a major bump.

**New code must NEVER use `createSeedLoader` / `seedLoaderToken`.** Zero hits
are allowed across the workspace — see the enforcement grep below.

### Registries handle their own lifecycle + built-in registration

> **ADR anchor.** Codified by
> [ADR-0052](../../docs/adr/0052-forfeature-registrar-class-pattern.md)
> §Registry lifecycle rule.

The `forFeature` registrar-class pattern above governs EXTERNAL contributions. A
parallel rule governs INTERNAL seeding: every class extending
`BaseRegistry<K, V>` (from `@stackra/support`) owns its own module-local
lifecycle and its own built-in registration.

1. **Static built-ins land via `OnModuleInit`, never the constructor.** The
   constructor wires dependencies into fields; the `onModuleInit()` hook does
   the seeding. A constructor that calls `this.register(...)`,
   `this.replace(...)`, or a private `this.seed()` helper that does either is
   the same anti-pattern this steering forbids elsewhere.

2. **Config-driven built-ins are read from an injected config token in
   `OnModuleInit`.** The registry declares `@Inject(<MODULE>_CONFIG)` in its
   constructor and reads `this.config.builtIns` (or equivalent) during
   `onModuleInit`. The registry OWNS the seeding step; the module.ts wires the
   config token and the registry, nothing more.

3. **Consumer-supplied built-ins are injected as constructor deps.** When a
   module registers built-in classes as providers alongside the registry, the
   registry injects those classes directly via class-token DI (typed constructor
   parameter). Seeding happens in the registry's `onModuleInit`, NOT in the
   module.ts via a wrapper "registrar" class whose only job is to copy the
   built-ins into the registry.

4. **`forFeature` external contributions still route through inline
   `@Injectable()` registrar classes** per the rule above. Nothing here changes
   that. The registry-lifecycle rule ONLY covers built-in seeding that lives
   inside a package's own module tree.

**Timing.** The container's `OnModuleInit` fires during phase 3 of
`createInstances()`, after the registry's constructor and before any
`OnApplicationBootstrap` hook. That ordering lets registries seed themselves
ahead of `forFeature` registrars — feature contributions overlay the built-in
baseline, never race with it.

```ts
// ❌ Anti-pattern — work in constructor.
@Injectable()
export class HeroUiNativeRegistry extends BaseRegistry<
  string,
  ISduiComponentEntry
> {
  public constructor() {
    super();
    this.seed(); // ← runs 30+ this.replace(...) calls
  }
  private seed(): void {
    /* ... */
  }
}

// ✅ Canonical — seed in OnModuleInit.
@Injectable()
export class HeroUiNativeRegistry
  extends BaseRegistry<string, ISduiComponentEntry>
  implements OnModuleInit
{
  public onModuleInit(): void {
    this.seed();
  }
  private seed(): void {
    /* ... */
  }
}

// ✅ Config-driven built-ins.
@Injectable()
export class ThemeRegistry
  extends BaseRegistry<string, ITheme>
  implements OnModuleInit
{
  public constructor(
    @Inject(THEMING_CONFIG) private readonly config: IThemingConfig,
  ) {
    super();
  }
  public onModuleInit(): void {
    for (const theme of this.config.builtInThemes ?? []) {
      this.register(theme.name, theme);
    }
  }
}

// ✅ Consumer-supplied built-ins — inject the built-in classes,
//    register in OnModuleInit. Replaces the "BuiltInHandlerRegistrar
//    in module.ts" pattern.
@Injectable()
export class ActionRegistry
  extends BaseRegistry<string, IActionHandler>
  implements OnModuleInit
{
  public constructor(
    private readonly composite: CompositeHandler,
    private readonly dispatch: DispatchHandler,
  ) {
    super();
  }

  public onModuleInit(): void {
    this.register(this.composite.name, this.composite);
    this.register(this.dispatch.name, this.dispatch);
  }
}
```

## Enforcement

- Search for `class *Bootstrap` inside package `src/`. Zero hits allowed.
- Search for `_BOOTSTRAP` symbol tokens whose only consumer is the same
  package's own module. Zero hits allowed.
- Search for `useFactory` bodies that end in `return true;` / `return null;`
  after a side effect. Zero hits allowed — use an inline `@Injectable()` class
  implementing `OnApplicationBootstrap` instead (see ADR-0052).
- Search for `createSeedLoader(` / `seedLoaderToken(` imports from
  `@stackra/support`. **Session 3 of the ADR-0052 rollout landed on 2026-07-28**
  — the helpers were deleted from `@stackra/support`. Zero hits allowed across
  every package in the workspace. Any hit is a P1 finding.
- Every class extending `BaseRegistry` whose constructor body calls
  `this.register(`, `this.replace(`, or `this.seed(`. Zero hits allowed — seed
  via `OnModuleInit` per ADR-0052 §Registry lifecycle rule.
- Every module.ts whose sole purpose for a registrar class is seeding built-ins
  from injected classes already registered as providers in the same module. Zero
  hits allowed — dissolve the registrar into the registry's `OnModuleInit`.
- Every `Registry` / `Manager` / `Service` that owns mutable state should
  implement `OnModuleInit` when it needs post-wire population.
- Every service that scans other modules (discovery, loaders) should implement
  `OnApplicationBootstrap`.
- Every `forFeature(...)` registrar class implements `OnApplicationBootstrap`
  (never `OnModuleInit`) — feature seeders target a base module's registry,
  which is a cross-module concern.

## When you're tempted

If you find yourself writing `class SomethingBootstrap`, stop. Ask:

1. **What state am I populating?** — Move the population into that state's own
   `onModuleInit`.
2. **What am I scanning?** — Move the scanning into a properly-named loader
   service (`XLoader`, `XDiscovery`) that implements `OnApplicationBootstrap`.
3. **Why can't I use the existing lifecycle hooks?** — If the answer is "the
   container doesn't call them for my provider," fix the wiring (the provider
   must be listed in `providers: [...]` — not `exports` only). Never work around
   it with a synthetic bootstrap class.
