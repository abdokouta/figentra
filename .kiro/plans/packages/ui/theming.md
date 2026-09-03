---
status: canonical
component: package
package: "@stackra/theming"
---
# Theming — implementation plan

Cross-platform design-token, theme, density and accessibility abstraction. UI components consume tokens; applications select themes.

## API
Typed token schema, theme registry, resolver, runtime adapter and persistence/restore policy. Tokens are serializable and versioned.

## Security/testing
No executable styles or untrusted code in theme payloads. Test contrast metadata, dark/light/high-contrast variants, token fallback and SSR/native behavior.

## Exit criteria
One theme/token owner with deterministic runtime adapters and no component-level global styling hacks.
