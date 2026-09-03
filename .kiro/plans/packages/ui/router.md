---
status: canonical
component: package
package: "@stackra/router"
---
# Router — implementation plan

Own application route definitions, matching, navigation state and route guards integration. Deep-link parsing/opening remains `@stackra/link`.

## API
Typed route tree, matcher, navigator, params/search-state codecs and lifecycle hooks. Platform adapters are explicit; services are never imported.

## Security/testing
Route access checks delegate to identity/IAM context; invalid params fail closed. Test matching, nested routes, redirects, deep-link integration and SSR/runtime differences.

## Exit criteria
One routing owner across applications with no route logic in link or business packages.
