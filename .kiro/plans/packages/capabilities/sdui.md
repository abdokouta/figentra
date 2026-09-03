# @stackra/sdui — Controlled Server-Driven UI

**Status:** Normative implementation plan
**Package:** `@stackra/sdui`
**Capability:** Controlled schema-driven UI runtime
**Depends on:** `@stackra/contracts`, `@stackra/schema`, `@stackra/security`, `@stackra/http`, `@stackra/storage` where media references are required

## Purpose

Provide the renderer-neutral document contract and runtime infrastructure for schema-driven UI. The package is not a page-builder editor and does not own page persistence, business data, or application-specific components.

## Boundary

```text
@sdui
  core schema + AST + validation + bindings + actions + renderer contracts
  /schema       schema versions and JSON Schema tooling
  /react        React renderer/runtime
  /react-native React Native renderer/runtime
  /nestjs       NestJS DTO/validation/controller helpers
  /testing      conformance fixtures and renderer test utilities
```

Providers and framework dependencies are subpaths. The root remains runtime-neutral.

## Canonical document model

Every document has:

```ts
interface SduiDocument {
  schemaVersion: string;
  documentId: string;
  revision: number;
  root: SduiNode;
  metadata: SduiDocumentMetadata;
}

interface SduiNode {
  id: string;
  type: string;
  version: string;
  props: Record<string, unknown>;
  bindings?: SduiBinding[];
  layout?: SduiLayout;
  styles?: SduiStyles;
  visibility?: SduiCondition;
  children?: SduiNode[];
}
```

The exact public types are locked in package source before implementation and covered by JSON Schema conformance fixtures.

## Component contract

A registered component definition must declare type/version, props schema, child constraints, defaults, accepted bindings, supported actions, accessibility requirements, responsive behavior, renderer availability and compatibility constraints.

No component definition may contain executable implementation code in a persisted document.

## Safe component vocabulary

The initial vocabulary is intentionally limited:

- page
- section
- container
- stack
- grid
- columns
- text
- heading
- rich-text
- image
- video
- button
- spacer
- hero
- product-grid
- collection-grid
- form

Applications may register additional components through a typed capability contract.

## Bindings

Bindings reference approved application data contracts:

```ts
interface SduiBinding {
  source: string;
  path?: string;
  args?: Record<string, unknown>;
  transform?: SduiTransform[];
}
```

Transform operators are allow-listed. SQL, arbitrary expressions, JavaScript and unrestricted network access are invalid.

Bindings are resolved in the owning application/service context. `@stackra/sdui` never talks directly to a service database.

## Actions

Actions are typed and capability checked:

```text
navigate
submit
open
add-to-cart
invoke-command
```

Every action declares an input schema and authorization/capability requirement. The renderer must reject unknown action types.

## Renderer model

The runtime resolves a node by `(type, version)` to a registered component renderer. A renderer receives validated props, resolved bindings, action dispatchers and context rather than unrestricted global access.

React editor overlays are implemented outside core and decorate the same renderer used by production.

## Versioning and compatibility

Schema versions use explicit immutable identifiers. Published documents remain renderable for their declared schema version while compatible renderer implementations are retained.

Breaking schema changes require a migration function and conformance tests. Silent interpretation changes are prohibited.

## Validation pipeline

```text
receive document
 -> schema validation
 -> node/component validation
 -> binding contract validation
 -> action/capability validation
 -> security policy validation
 -> compatibility validation
 -> render
```

Validation failures are typed and safe to expose to callers; internal diagnostics never leak secrets or implementation internals.

## Security

The package must prevent:

- arbitrary code execution;
- unsafe URL schemes;
- untrusted HTML unless sanitized by an explicit trusted content capability;
- CSS escape/injection through unbounded style values;
- unauthorized actions;
- cross-tenant binding leakage;
- unrestricted data fan-out.

Tenant and principal context are propagated from the host runtime. The package does not implement application authorization policy itself.

## Responsive layout

The canonical layout representation is constraint-based. Supported primitives include breakpoint-aware display, direction, alignment, gap, padding, margin, width, height, min/max constraints, grid columns and visibility.

Absolute browser coordinates are not persisted as canonical layout.

## NestJS integration

`@stackra/sdui/nestjs` provides DTO decorators, validation pipes/helpers, response typing and controller helpers. It does not create a new service boundary. Owning services remain responsible for persistence and business authorization.

## Caching

Published immutable documents may use HTTP/CDN caching when the document is public and non-personalized. Drafts and personalized documents must respect authorization and tenant isolation.

ETag/version headers are preferred for immutable revisions.

## Observability

Integrations emit operational telemetry through the platform observability stack, including render duration, validation failure counts, component resolution failures, binding latency and action failures. No raw sensitive binding data is logged.

## Testing

Required suites:

- schema fixture conformance;
- round-trip serialization;
- validator rejection tests;
- schema migration tests;
- renderer registration tests;
- action capability tests;
- tenant isolation tests;
- unsafe content rejection tests;
- responsive layout determinism tests;
- React and React Native golden rendering tests where appropriate.

## Completion criteria

The package is complete only when all public types are documented, schema versions are immutable, renderer contracts are implemented, validators are exhaustive, unsafe constructs are rejected, conformance fixtures pass in CI, and every supported runtime has a versioned compatibility matrix.

## Explicit non-goals

This package does not own:

- page builder UI;
- pages/templates database;
- publishing workflow;
- CMS business state;
- product/catalog business data;
- Application Registry business state;
- Gateway routing;
- arbitrary custom code execution.
