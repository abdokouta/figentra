# Runtime Model

The container has two levels of lifetime:

```text
Application Context
├── singleton providers
├── module graph
└── runtime adapters

Request Context
├── Request
├── runtime values
└── request-scoped providers
```

Cloudflare Bindings are runtime-provided dependencies. They are not a replacement for application DI.

```text
Bindings → Worker adapter → RequestContext → DI → Application
```

## Entry-point isolation

The root entry must remain framework-neutral. React bindings are exposed only through `@stackra/container/react` and `@stackra/container/native`. Worker consumers should import the root entry for DI primitives and `/worker` for the runtime adapter without importing React.
