# 17 — Versioning Standard

**Status: FOUNDATION**

## Versioned artifacts

- REST APIs
- SDKs
- events
- webhooks
- manifests
- integrations

## API

Use explicit major versions:

```text
/v1
/v2
```

Avoid unnecessary internal versioning.

## Compatibility

Additive changes should remain compatible.

Breaking changes require a new major contract.

## Events

Event type + schema version define compatibility.

## Webhooks

Webhook versions can evolve independently where provider compatibility requires it.

## Deprecation

Every public contract needs:
- owner
- current version
- supported versions
- deprecation date
- migration guidance
- sunset policy
