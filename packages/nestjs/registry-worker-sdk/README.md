# @figentra/registry

NestJS integration for the Figentra Application Registry. It provides a DI-first registration contract so services can declare their inventory without coupling domain code to HTTP.

## Composition

```ts
RegistryModule.forRoot({
  application: "identity",
  version: process.env.APP_VERSION!,
  registryUrl: process.env.REGISTRY_URL!,
  registrationToken: process.env.REGISTRY_TOKEN,
  environment: process.env.FIGENTRA_ENVIRONMENT as "development" | "staging" | "production",
});

RegistryModule.forFeature({
  modules: [{ key: "identity" }],
  resources: [{ key: "users", moduleKey: "identity" }],
  actions: [{ key: "read", resourceKey: "users", permission: "identity:users:read" }],
  navigation: [{ key: "users", path: "/users", permission: "identity:users:read" }],
});
```

For future categories that are still manifest-only, use `RegistryModule.forManifest()` rather than introducing ad-hoc D1 writes.

`forRoot()` owns transport/application identity. `forFeature()` declares inventory. `RegistryService.register()` sends the composed manifest to the Registry Worker. Registration failures can be fail-soft or fail-fast via `failOnRegistrationError`.

The Registry Worker remains the authoritative control plane; this package is only the NestJS producer/client integration.
