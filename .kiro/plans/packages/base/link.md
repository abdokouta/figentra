---
status: canonical
component: package
package: "@stackra/link"
---
# `@stackra/link` — implementation plan

Canonical deep-link/URL parsing and opening boundary. It owns link representation, validation, resolution and external/internal link handling; router/navigation owns application routes.

## API
`Link`, parser, normalizer, resolver, opener adapter and typed link errors. Runtime adapters provide browser/native/desktop open behavior.

## Security
Scheme/host allowlists, canonicalization, path/query size limits and rejection of unsafe schemes. Never execute arbitrary link content.

## Testing
Parsing/canonicalization, malformed links, Unicode/encoding, allowlists and runtime opener conformance.

## Exit criteria
Deep links have one ownership boundary and no routing logic leaks into link or error packages.
