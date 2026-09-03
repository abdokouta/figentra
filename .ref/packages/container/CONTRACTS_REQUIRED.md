# @stackra/contracts requirement

The container's request scope is designed around the canonical `Scope.REQUEST` enum member.

The current uploaded container test suite already expects:

```ts
Scope.DEFAULT === 0
Scope.TRANSIENT === 1
Scope.REQUEST === 2
```

This implementation also exports `REQUEST_SCOPE` as a compatibility alias. In a workspace where `Scope.REQUEST` is present, it resolves to that canonical enum member.

If updating `@stackra/contracts` independently, ensure `ScopeOptions.scope` accepts the `Scope.REQUEST` member.
