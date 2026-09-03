---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/theming"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/schema", "@stackra/storage", "@stackra/i18n"]
---
# `@stackra/theming` — implementation plan

## Purpose
Canonical design-token/theme/density/accessibility abstraction. It owns typed token schemas, theme definitions, theme selection, inheritance, persistence and runtime adaptation. Components consume tokens; applications select themes.

## Public API
```ts
interface ThemeRegistry {
  register(theme:ThemeDefinition):void;
  get(id:string,version?:string):ThemeDefinition;
  list():readonly ThemeDefinition[];
}
interface ThemeManager {
  current():ResolvedTheme;
  set(themeId:string):Promise<void>;
  subscribe(handler:(theme:ResolvedTheme)=>void):()=>void;
}
interface TokenResolver { get<T>(key:TokenKey):T; has(key:TokenKey):boolean; }
interface ThemeDefinition { id:string; version:string; mode:'light'|'dark'|'high-contrast'; density:string; tokens:Record<string,unknown>; }
```

## Source tree
```text
packages/theming/
├── src/core/{theme,registry,resolver,manager,tokens,density,errors,index.ts}
├── src/persistence/{serializer,storage,migrations,index.ts}
├── src/runtime/{browser,native,desktop,ssr,index.ts}
├── src/react/{provider,hooks,index.ts}
├── src/testing/{theme-fixture,resolver-fixture,index.ts}
└── __tests__/{unit,integration,conformance}/
```

## Token model
Tokens are typed, namespaced and versioned. Semantic tokens (`color.surface.default`) resolve to primitive tokens through a deterministic graph. Cycles/missing dependencies fail registration. Token payloads are JSON-safe and bounded.

## Theme inheritance
A theme can extend one explicitly declared parent version. Resolution is `child → parent → default`. Overrides are immutable snapshots. Production cannot load arbitrary theme code or executable style functions.

## Runtime adaptation
Browser maps tokens to CSS custom properties; native/desktop map tokens to platform style structures; SSR returns serialized token metadata without DOM dependencies. Runtime adapters cannot mutate global styles outside their declared mount root.

## Accessibility
Theme definitions include contrast metadata and variants for reduced motion/high contrast where applicable. Theme resolution must not reduce accessibility guarantees. Components still own semantic accessibility behavior.

## Persistence/security
Selected theme ID/version/density may be persisted using `@stackra/storage`. Secrets and sensitive app state are never included. Untrusted theme payloads are schema-validated, size-limited and non-executable. CSS values are sanitized/allowlisted before DOM insertion.

## Observability
Measure theme load/resolve failures, fallback count and adapter application latency. Telemetry records theme IDs/versions, not arbitrary token payloads.

## Testing
Token resolution/cycle detection, inheritance, fallback, version migrations, light/dark/high-contrast variants, CSS serialization safety, SSR/native parity and persistence restore. Accessibility fixtures validate documented contrast metadata.

## Implementation phases
1. Token schema/registry.
2. Theme resolver/manager/inheritance.
3. persistence/migrations.
4. browser/native/desktop adapters.
5. React bindings, accessibility, security and conformance tests.

## Exit criteria
- One theme/token system is used by all UI packages.
- Token resolution is deterministic/versioned.
- Untrusted themes cannot execute code or escape style boundaries.
- Runtime adapters are explicit and tested.
