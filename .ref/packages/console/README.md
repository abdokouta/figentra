# @stackra/console

CLI framework for the @stackra monorepo — @stackra/container command execution
with interactive prompts, auto-discovery, and config publishing.

## Installation

```bash
# Workspace dependency
"@stackra/console": "*"
```

## Runtime dependencies

`@stackra/console` is a CLI RUNTIME (ships a `bin` entry — `bin/stackra`). Per
[ADR-0051 — CLI-package `dependencies` block exception](../../../docs/adr/0051-cli-package-dependencies-exception.md),
the six deps below are declared under `dependencies` (not `peerDependencies`)
because they are CLI-time only — the CLI binary is their sole caller, and
consuming apps never `import` from them.

| Dependency       | Consumed by                                                  |
| ---------------- | ------------------------------------------------------------ |
| `@clack/prompts` | Interactive prompts for `stackra new` and `stackra make:*`.  |
| `boxen`          | Terminal box rendering for the CLI intro banner.             |
| `cli-table3`     | Aligned tables in `stackra catalog:list` / `catalog:search`. |
| `ejs`            | Template engine for every `stackra make:*` scaffold command. |
| `picocolors`     | ANSI color output across the terminal-writer service.        |
| `terminal-link`  | Clickable hyperlinks in supporting terminals (docs URLs).    |

Every dep is pinned via the workspace `catalog:` protocol so version drift is
impossible.

## License

MIT © Figentra L.L.C.
