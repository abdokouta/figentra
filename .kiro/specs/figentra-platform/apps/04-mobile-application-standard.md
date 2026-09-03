# Mobile Application Standard — Kiro Specification

## Scope

This is the reusable standard for any Figentra mobile application, including the
current `apps/family` application and future mobile products.

## Architecture

- React Native/Expo unless a platform-specific requirement requires native code.
- Offline-capable data must use an explicit local persistence/sync strategy.
- Authentication tokens are stored in secure platform storage, never plain
  AsyncStorage.
- API access uses the typed Figentra SDK/Stackra Query-compatible layer.
- Local state and server state remain separate.

## Offline and sync

When a mobile product is offline-first, specify: initial sync, incremental sync,
sync queue, retries, conflict resolution, media upload, tombstones, schema
versions, and retention. Never invent a generic sync engine without a product
requirement.

## Security

Certificate/token handling, device logout, compromised-device recovery,
biometric unlock, deep links and push-token lifecycle must be explicitly tested
before release.

## Testing

Unit, integration, offline/online transition, network failure, storage
migration, accessibility, localization/RTL, device matrix and E2E release tests
are mandatory for production mobile apps.
