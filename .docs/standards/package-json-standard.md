# package.json Standard

Every package manifest must deliberately define:

- package identity
- package manager/runtime constraints
- scripts
- exports
- files
- side effects
- dependencies
- peerDependencies
- peerDependenciesMeta
- devDependencies

Use workspace catalogs for shared dependency versions. Do not duplicate a
dependency as runtime, peer and dev dependency without a documented reason.

Exports must be explicit and must not expose internal source paths.
