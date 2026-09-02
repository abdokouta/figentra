# 16 — Frontend Platform

**Status: FOUNDATION**

## Stack

```text
Vite
React
React Router 7
HeroUI
Internal Query
Internal State
Internal HTTP
```

## No Refine

Refine is removed from the platform architecture.

The internal query package already provides:
- useQuery
- useMutation
- useOne
- useMany
- cache
- invalidation
- optimistic updates

Avoid overlapping data-layer abstractions.

## No SDUI

No server-driven UI.

Backend provides:
- data
- permissions
- capabilities
- branding
- theme tokens
- configuration

Frontend owns rendering.

## Routing

React Router 7 owns routing.

Registry can provide resource metadata, but route generation must not eliminate explicit custom routes.

Example:

```text
/resources
/resources/:id
/settings
/onboarding
/reports/custom
```

## HeroUI

HeroUI is the shared UI foundation.

Applications can receive theme tokens:

```text
Application Registry
 ↓
Theme configuration
 ↓
React application
 ↓
HeroUI theme/provider
 ↓
DOM
```

Backend returns theme/configuration data, not JSX/UI schemas.

## Portal

Each application owns its portal/shell while sharing platform packages.

Shared:
- auth
- query
- HTTP
- UI
- theme
- authorization helpers
- navigation primitives

Application-owned:
- pages
- domain components
- business workflows
- resource forms
