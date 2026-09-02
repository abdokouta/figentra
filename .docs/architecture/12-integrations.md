# 12 — Integrations / App Store

**Status: DESIGN PENDING**

## Concepts

```text
App
Integration
Installation
Connection
Credential
Configuration
Webhook
Capability
```

## Lifecycle

```text
discover
 ↓
install
 ↓
authorize
 ↓
configure
 ↓
active
 ↓
disabled/revoked
```

## Separation

```text
Feature Flag = rollout/operational control
Entitlement = commercial capability
Permission = authorization
Installation = tenant decision
```

These must not be collapsed.

## Marketplace

Future app store may provide:
- discovery
- installation
- OAuth
- configuration
- capability declarations
- versioning
- uninstall/revoke
