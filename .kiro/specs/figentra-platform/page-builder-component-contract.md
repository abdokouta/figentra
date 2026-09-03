# Figentra — Page Builder Component Contract

**Status:** Normative
**Owner:** `@stackra/sdui` + application-owned component implementations

## Purpose

Define the contract that lets the visual page builder discover, validate and render approved components without coupling the persisted document to React implementation details.

## Definition

```ts
interface PageBuilderComponentDefinition {
  type: string;
  version: string;
  category: string;
  title: string;
  propsSchema: JsonSchema;
  defaults: Record<string, unknown>;
  children?: ChildConstraint;
  bindings?: BindingCapability[];
  actions?: ActionCapability[];
  layout?: LayoutCapability;
  responsive?: ResponsiveCapability;
  accessibility?: AccessibilityRequirement[];
  renderers: RendererCapability[];
  compatibility: CompatibilityConstraint[];
}
```

## Rules

1. `type + version` is the stable persisted identity.
2. Renderer implementation names are not persisted in page documents.
3. Props are schema validated before mutation and before publish.
4. Child constraints are enforced by the builder and validator.
5. Binding sources are allow-listed and schema typed.
6. Actions are capability declarations, not callbacks.
7. Responsive support is explicit.
8. Required accessibility metadata is explicit.
9. Deprecated versions have a migration or a hard compatibility boundary.
10. Definitions contain metadata only; no executable JavaScript.

## Examples

### Hero

```text
type: hero
version: 1.0
props:
  title: string
  subtitle?: string
  image?: asset
  cta?: action
children: false
bindings: product.title, collection.title, page.hero.*
```

### Product grid

```text
type: product-grid
version: 1.0
props:
  columns: responsive-number
  limit: integer
  presentation: enum
bindings: catalog.products
```

The component receives a typed data contract and does not embed the product dataset in the page definition.

## Registry projection

Application builds may publish a sanitized component definition projection to Application Registry. The projection is metadata for discovery/configuration only. Registry does not own renderer implementations and does not execute component code.

## Compatibility

Applications publish a manifest/component capability version. A page may only reference a component version supported by the target application release/environment.

## Security

Definitions cannot introduce arbitrary network destinations, arbitrary scripts, unrestricted HTML, SQL or credentials. Action capabilities must identify required authorization/capability semantics.

## Testing

Each component definition requires:

- schema fixtures;
- valid/invalid prop fixtures;
- child constraint tests;
- binding compatibility tests;
- action capability tests;
- accessibility tests;
- renderer registration tests;
- backward compatibility/migration tests.
