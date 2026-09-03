# ADR-0012 — Controlled SDUI and Visual Page Builder

**Status:** ACCEPTED
**Date:** 2026-09-03
**Supersedes:** ADR-0007 — No Server-Driven UI

## Context

Figentra needs a visual page-builder capability comparable in architectural behavior to Shopify and WordPress: merchants and operators must be able to compose pages from approved sections and components, edit responsive layout and content, preview drafts, publish immutable revisions, and bind component properties to application data.

A conventional SDUI implementation alone does not solve this problem. Conversely, a page builder that edits rendered React trees or serializes arbitrary HTML/JavaScript creates an unmaintainable and unsafe system.

## Decision

Figentra adopts a **controlled, schema-driven UI model** for visual page building.

The architecture is split into two reusable capabilities:

- `@stackra/sdui` — runtime document schema, validation, bindings, renderer contracts, and safe rendering infrastructure.
- `@stackra/page-builder` — visual authoring model, editor state, document commands, drag/drop, responsive layout editing, component palette, inspector, revisions and publishing workflow integration.

The page builder edits a typed page document. It never edits a rendered DOM tree and never persists arbitrary executable code.

## Architectural boundaries

```text
PAGE BUILDER
  authoring, editor state, commands, selection, drag/drop
        |
        v
PAGE DOCUMENT
  immutable typed AST / schema
        |
        v
SDUI
  schema, validation, bindings, renderer contracts
        |
        +-------------------+
        |                   |
        v                   v
React renderer       React Native renderer
```

The Application Registry remains a metadata/control-plane system. It may index approved application UI capabilities, routes and component metadata, but it does not own page business state, page revisions, or rendering.

The Gateway remains an edge routing layer.

No dedicated SDUI Worker, Page Builder Worker, SDUI service, or Page Builder microservice is introduced by this ADR.

Business services that own pages/templates/content expose the necessary NestJS APIs and persistence. The page-builder package is a reusable authoring client capability and does not become a domain database.

## Document model

A page is represented as a tree of typed nodes. Every node has a stable ID, component type, schema version, props, optional bindings, responsive layout/style data, optional conditions, and children where permitted.

The canonical node model supports:

- page, section, container, stack, grid and columns layout primitives;
- text, heading, rich text, image, video, button, spacer and media primitives;
- application-owned business components such as product-grid, collection-grid, forms, reviews and commerce components through registered capabilities;
- typed actions such as navigation, submit, open, add-to-cart and invoke-approved-command;
- static and bound properties;
- visibility/condition rules with an allow-listed expression model;
- accessibility metadata;
- locale and content variants;
- responsive overrides by breakpoint.

Absolute canvas coordinates are not the canonical representation for responsive web pages.

## Data binding

Page documents may reference approved data sources instead of embedding service-owned business data. A binding identifies a source, selection/query contract, optional transformation from an allow-listed operator set, and expected schema.

Examples include:

```text
product.title
product.images.primary.url
catalog.products(collection = "summer", limit = 12)
customer.firstName
```

Bindings are resolved by the owning application/service runtime. The page builder never receives unrestricted database access and never persists SQL or arbitrary backend expressions.

## Safety

The following are prohibited in persisted page documents and manifests:

- arbitrary JavaScript;
- arbitrary CSS injection outside the approved style system;
- executable server-side code;
- SQL/database queries;
- service credentials or secrets;
- arbitrary network requests;
- serialized React component implementations;
- unbounded expression languages.

Component availability, actions, bindings and style capabilities are explicitly allow-listed.

## Versioning and publishing

Pages use immutable revisions.

```text
DRAFT -> VALIDATE -> PREVIEW -> PUBLISH -> IMMUTABLE PUBLISHED REVISION
```

A page stores pointers to its draft and published revisions. Rollback publishes an existing immutable revision; it does not mutate historical data.

Publish is rejected when schema validation, component capability validation, binding validation, authorization, localization requirements or asset constraints fail.

## Editor/runtime parity

The page builder uses the same renderer and component definitions as production wherever practical. Editor-only overlays are decorators around the normal renderer:

```text
production renderer
        + selection overlay
        + drop-zone overlay
        + hover/inspection metadata
        + debug diagnostics
```

A separate fake preview implementation is prohibited.

## Commands and undo/redo

Editor mutations are typed commands, including:

- InsertNode
- DeleteNode
- MoveNode
- DuplicateNode
- UpdateProps
- UpdateBindings
- UpdateStyles
- WrapNode
- UnwrapNode
- SetVisibility

The document is updated through command application. Undo/redo operates on command history and/or immutable document snapshots according to the implementation chosen by the package specification.

## Component registry

A component definition contains at minimum:

- stable type and version;
- category;
- props JSON Schema;
- child constraints;
- default props;
- editor inspector metadata;
- supported bindings;
- actions/capabilities;
- responsive behavior;
- renderer mapping;
- compatibility requirements.

The definition is shared between editor validation, runtime validation and renderer registration. Application implementations remain application-owned.

## Templates and reusable sections

The model distinguishes:

```text
Template -> Section -> Block/Component -> Node
```

Templates support contextual bindings such as product, collection, article, landing page, checkout or account data. Reusable sections and blocks can be copied into pages without transferring service-owned business state.

## Responsive layout

The canonical layout system is constraint-based and responsive. Supported primitives include containers, flex/stack, grid, alignment, spacing, sizing, visibility and breakpoint overrides.

The editor may expose pixels/drag gestures as a convenience, but those gestures must compile into the canonical responsive constraints rather than persisted absolute coordinates.

## Runtime placement

No dedicated page-rendering service is required in V1.

The owning application/service exposes a typed page read API and resolves bindings from its authorized domain APIs. CDN/edge caching may be used for immutable published documents where authorization and personalization semantics permit it.

Cloudflare Workers are not introduced solely to render SDUI.

## Consequences

Positive:

- page builder complexity is isolated from runtime rendering;
- schema-driven rendering is testable and versionable;
- editor and production share the same component contract;
- responsive behavior is deterministic;
- pages can be published and rolled back safely;
- arbitrary code execution is avoided;
- Registry remains cleanly separated from business data.

Negative:

- the component/schema vocabulary must be deliberately designed and versioned;
- rich design-tool behavior requires substantial editor engineering;
- dynamic data bindings require strict contracts and authorization.

## Rejected alternatives

### Dedicated SDUI Worker

Rejected. SDUI is a schema/rendering capability, not an independent deployment boundary.

### Dedicated Page Builder service

Rejected for the initial platform. The builder is reusable application infrastructure while page persistence and business semantics belong to the owning service.

### HTML/DOM serialization

Rejected. It couples persisted data to one renderer and makes responsive behavior, validation, migrations and security harder.

### Arbitrary code blocks

Rejected. Extension points must use registered components, actions and capabilities.

### Application Registry owns page content

Rejected. Registry owns metadata/projection, not application business state.

## Implementation gate

This ADR is not complete merely because package names exist. The implementation is accepted only when the corresponding package plans define public types and contracts, document schema versioning, validators, renderer registration, bindings, editor commands, persistence contract, draft/publish semantics, authorization, asset handling, observability, testing, migrations, failure semantics and compatibility tests.
