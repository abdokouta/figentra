# Changesets

Every publishable Stackra package change must include a changeset.

Applications and private deployables do not require a release changeset unless
they intentionally publish a versioned artifact.

Create one with:

```bash
pnpm changeset
```

The release pipeline consumes these files to calculate versions and changelogs.
