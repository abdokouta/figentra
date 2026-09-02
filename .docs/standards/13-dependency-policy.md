# Dependency and Catalog Policy

## Default

All versions are centralized in `package.json workspaces`.

Deployable packages use:

```json
"package": "catalog:"
```

Named catalogs are used only when a package family must intentionally have a separate version line.

## Runtime vs dev

`dependencies`:
- packages imported by runtime code
- framework/runtime libraries
- validation/config/i18n
- database/ORM runtime

`devDependencies`:
- compilers
- CLI
- testing
- linting
- formatting
- type packages
- build tooling

`peerDependencies`:
- reusable libraries only, when the consumer must provide the dependency

Deployable applications/services should generally not use peerDependencies.

## Version consistency

A single service must not pin a version directly when the package exists in the workspace catalog.

Exceptions require an ADR or documented compatibility reason.

## Security

No automatic `npm audit fix --force` in the bootstrap path.

Dependency upgrades are lockfile + build + test + security-scan changes.
