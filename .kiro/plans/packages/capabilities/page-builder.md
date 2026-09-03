# @stackra/page-builder — Visual Page Builder

**Status:** Normative implementation plan
**Package:** `@stackra/page-builder`
**Capability:** Visual page authoring
**Depends on:** `@stackra/sdui`, `@stackra/ui`, `@stackra/storage`, `@stackra/http`, `@stackra/query`, `@stackra/state`

## Purpose

Provide the reusable visual authoring engine needed for a Shopify/WordPress-class page builder. It owns editor behavior and document authoring primitives, not domain persistence or rendering business data.

## Boundary

```text
@stackra/page-builder
  /schema      page-builder document helpers and migrations
  /editor      editor state, selection and commands
  /react       React editor shell, canvas and inspectors
  /blocks      component palette and block metadata contracts
  /registry    local component registration/catalogue
  /testing     command/editor/component fixtures
```

The package does not become a CMS service and does not own a database.

## Canonical concepts

```text
Page
Template
Section
Block
Component
Node
Binding
Revision
```

The persisted model is a typed `SduiDocument`. Builder metadata may add editor-only information but editor-only state must never leak into the published runtime document.

## Editor architecture

```text
BuilderShell
 ├── TopBar
 │    ├── undo/redo
 │    ├── preview
 │    ├── device selector
 │    └── publish intent
 ├── ComponentPanel
 ├── Canvas
 │    ├── renderer
 │    ├── selection overlay
 │    ├── drop zones
 │    └── insertion indicators
 └── Inspector
      ├── content
      ├── data
      ├── layout
      ├── style
      ├── responsive
      └── accessibility
```

The canvas renders the same component renderer used by production, with editor overlays and interaction adapters layered on top.

## Commands

All mutations go through typed commands:

```text
InsertNode
DeleteNode
MoveNode
DuplicateNode
UpdateProps
UpdateBindings
UpdateStyles
WrapNode
UnwrapNode
SetVisibility
ReplaceNode
```

Commands validate preconditions and produce deterministic document transitions. Commands must be serializable for debugging and collaborative extensions.

## Selection model

Selection identifies stable node IDs rather than DOM references. Editor state contains:

- selected node IDs;
- focused node;
- hover node;
- active breakpoint;
- active editing surface;
- drag session state;
- command history;
- dirty state.

DOM references are transient adapters only.

## Component palette

Palette entries are derived from registered component definitions. Each entry includes category, title, icon metadata, defaults, accepted parent types and capability requirements.

The palette must not allow insertion of a component that cannot pass the SDUI validator for the current document context.

## Inspector

Inspector controls are schema-generated where possible and may be custom for complex components. Fields include typed controls for:

- text and rich content;
- assets;
- links/actions;
- numeric and spacing values;
- colors/tokens;
- responsive overrides;
- bindings;
- visibility conditions;
- accessibility labels.

An inspector field writes typed command operations; it does not directly mutate arbitrary JSON.

## Drag and drop

Drag/drop targets are derived from child constraints declared by the component definition. The engine computes a legal insertion operation before mutation.

The editor must never rely on browser DOM order as the source of truth.

## Responsive editing

The editor supports desktop/tablet/mobile contexts and writes breakpoint overrides into the canonical responsive layout structure. A drag/resize gesture compiles into layout constraints instead of absolute coordinates.

## Data binding authoring

The builder presents only approved binding sources and schemas. A field may support:

```text
static value
binding
fallback
```

Bindings are validated against the host application's advertised data contracts. The builder never permits raw SQL, JavaScript or unrestricted expressions.

## Templates

Templates are first-class documents that contain contextual bindings. Page instances reference a template and supply context/configuration. Reusable sections are separate assets that can be inserted into templates/pages while preserving node identity semantics.

The package defines authoring primitives only; persistence and template ownership remain with the host service.

## Revision workflow

The builder API models:

```text
open revision
 -> edit commands
 -> validate
 -> preview
 -> request publish
 -> persisted immutable revision
```

The package does not perform authoritative publishing. The owning service authorizes and commits publication.

## Collaboration readiness

V1 need not implement multiplayer editing, but command IDs, stable node IDs and deterministic operations must be designed so an operational collaboration layer can later add optimistic concurrency without replacing the document model.

## Accessibility

The editor rejects component configurations that violate required accessibility metadata where the component definition declares a hard requirement. Warnings and blocking errors are distinct. Published documents must satisfy the application's configured accessibility policy.

## Localization

Text/content fields may have locale variants. The builder must distinguish localized content from structural configuration and allow validation of required locales before publication.

## Assets

Asset fields reference file/media IDs rather than embedding binaries. The host's media/files capability supplies upload sessions, validation, retention and authorization. The builder handles reference selection and presentation metadata only.

## Security

Required controls:

- tenant-aware document context;
- capability checks for components/actions;
- sanitized rich text through trusted host pipeline;
- no executable custom code;
- no arbitrary URL protocols;
- publish authorization delegated to host service;
- audit hooks for publish/rollback where host requires them.

## Failure semantics

The editor must preserve the last known valid document on command failure. Invalid mutations do not enter undo history. Network failures while saving draft state must leave the user-visible document state intact and surface a typed save conflict/error.

Concurrency uses optimistic revision/version checks. A stale update is rejected rather than silently overwriting a newer revision.

## Testing

Required suites:

- command unit tests;
- command inverse/undo tests;
- tree insertion/removal/move invariant tests;
- schema compatibility tests;
- drag/drop legality tests;
- responsive compilation tests;
- binding selection/validation tests;
- inspector schema tests;
- renderer/editor parity tests;
- accessibility validation tests;
- localization tests;
- optimistic concurrency tests;
- tenant isolation tests;
- browser integration tests for keyboard-only editing and common drag/drop flows.

## Completion criteria

The package is complete only when the document command model is deterministic, editor state is isolated from the published document, component registration is schema-backed, responsive constraints are canonical, production/editor rendering parity is tested, and host-service revision/publish integration contracts are fully specified.

## Non-goals

- database or CMS persistence;
- page publishing authority;
- catalog/product ownership;
- authentication/authorization implementation;
- application registry storage;
- arbitrary HTML/JS/CSS execution;
- browser DOM serialization as the document format.
