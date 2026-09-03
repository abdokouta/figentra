---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/file-system — architecture plan

**Status:** Planned (NEW package — no `.ref/` reference) **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Depends
on:** `@stackra/container`, `@stackra/contracts`, `@stackra/support`,
`@stackra/logger`

## Purpose

`@stackra/file-system` is the workspace's canonical LOCAL FILE-SYSTEM
abstraction. Distinct from `@stackra/storage` (object storage / blob buckets):
this package handles filesystem-shaped I/O — read/write/glob/watch/mkdir —
that's naturally local per-process.

Enterprise requirements day one:

- **Path-based I/O** — familiar filesystem semantics (paths, directories).
- **Cross-runtime** — Node uses `node:fs/promises`, Workers use no-op (Workers
  have no local FS) OR fall back to R2 (via `@stackra/storage`) with a
  filesystem-shaped adapter.
- **Sync vs async** — every operation has both variants where the driver
  supports it.
- **Watch** — filesystem watchers (chokidar-backed on Node; polling fallback).
- **Glob** — pattern-matching directory traversal.
- **Streaming** — read/write large files without loading into memory.
- **Atomic writes** — write-to-tmp + rename for crash-safe writes.
- **Path safety** — reject `../` traversal outside the configured root (chroot
  semantics).
- **Compression** — read/write gzip/zstd via helper streams.
- **Hashing** — content-hash + directory-hash helpers.
- **NestJS `@InjectFileSystem()` decorator**.

## Why NOT fold into @stackra/storage

- `@stackra/storage` = object storage. Flat namespace, blob-oriented, remote,
  designed for concurrent access from N clients. Presigned URLs, S3, R2.
- `@stackra/file-system` = local filesystem. Hierarchical, path-oriented,
  in-process, designed for local persistence + config + logs + tmp files.
  chokidar watches, glob patterns.

Different mental models; different APIs; different runtime constraints. Merging
would produce a lowest-common-denominator API that satisfies neither.

## Non-goals

- Distributed filesystem (that's `@stackra/storage`).
- Symlink-heavy semantics (link support included but simplified).
- Watch across network mounts.
- Real-time collaborative editing (out of scope).

## Manager pattern — Manager (Shape A per ADR-0090)

`FileSystemManager extends Manager<IFileSystem>` — Shape A: usually ONE active
filesystem per app (`node-fs` for services; `memory` for tests). Named
filesystems are a rare use-case (a scratch FS + a config FS).

```typescript
FileSystemModule.forRoot({
  default: "node",
  filesystems: {
    node: { driver: "node-fs", root: "./data", createIfMissing: true },
    memory: { driver: "memory" },
    tmp: { driver: "node-fs", root: "/tmp/app", createIfMissing: true },
  },
});
```

## Subpath layout (per ADR-0091)

```
packages/file-system/
├── src/
│   ├── core/
│   │   ├── file-system.module.ts
│   │   ├── constants/
│   │   ├── decorators/                # @InjectFileSystem(name?)
│   │   ├── drivers/                   # memory driver
│   │   │   └── memory-file-system.driver.ts
│   │   ├── errors/                    # FileNotFoundError, PermissionDeniedError, PathTraversalError
│   │   ├── interfaces/
│   │   ├── services/                  # FileSystemManager, PathResolver, GlobResolver
│   │   ├── streams/                   # readStream, writeStream helpers
│   │   ├── utils/                     # path safety (chroot), MIME detector, hash
│   │   └── index.ts
│   │
│   ├── node/                          # Node driver (optional peer via node:fs)
│   │   ├── node-fs.driver.ts
│   │   ├── watcher.ts                 # chokidar-backed watch
│   │   ├── glob.ts                    # glob via fast-glob
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── file-system.module.ts
│   │   ├── health/
│   │   │   └── file-system.health-indicator.ts   # free space, R/W permission
│   │   └── index.ts
│   │
│   ├── worker/
│   │   ├── file-system.module.ts
│   │   ├── drivers/
│   │   │   ├── r2-adapter.driver.ts      # wraps @stackra/storage as filesystem shim
│   │   │   └── kv-adapter.driver.ts       # env.KV as filesystem shim (small files)
│   │   └── index.ts
│   │
│   └── testing/
│       ├── mock-file-system.ts        # in-memory driver w/ full API
│       ├── temp-dir-fixture.ts        # per-test tempDir via mkdtemp
│       └── index.ts
│
├── __tests__/
├── ...manifests
```

## Contracts split

| Symbol                  | Kind      |
| ----------------------- | --------- |
| `IFileSystem`           | interface |
| `IFileSystemManager`    | interface |
| `IFileStat`             | interface |
| `IFileWatcher`          | interface |
| `IGlobOptions`          | interface |
| `FileType` enum         | enum      |
| `FILE_SYSTEM_MANAGER`   | token     |
| `FILE_SYSTEM_DEFAULT`   | token     |
| `FileNotFoundError`     | class     |
| `PermissionDeniedError` | class     |
| `PathTraversalError`    | class     |

## Core API (locked)

```typescript
interface IFileSystem {
  // Read
  readFile(path: string, encoding?: BufferEncoding): Promise<string | Buffer>;
  readJson<T>(path: string): Promise<T>;
  readStream(path: string): Promise<ReadableStream>;
  readLines(path: string): AsyncIterable<string>;

  // Write
  writeFile(
    path: string,
    content: string | Buffer | ReadableStream,
    options?: IWriteOptions,
  ): Promise<void>;
  writeJson(
    path: string,
    data: unknown,
    options?: IWriteOptions,
  ): Promise<void>;
  writeAtomic(path: string, content: string | Buffer): Promise<void>;
  writeStream(path: string): Promise<WritableStream>;
  appendFile(path: string, content: string | Buffer): Promise<void>;

  // Delete + move
  delete(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copy(
    sourcePath: string,
    destPath: string,
    options?: ICopyOptions,
  ): Promise<void>;

  // Introspect
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<IFileStat>;
  isFile(path: string): Promise<boolean>;
  isDirectory(path: string): Promise<boolean>;

  // Directory
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  rmdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  readdir(path: string): Promise<string[]>;

  // Glob
  glob(pattern: string, options?: IGlobOptions): AsyncIterable<string>;

  // Watch
  watch(path: string, options?: IWatchOptions): IFileWatcher;

  // Hashing
  hashFile(path: string, algorithm?: "sha256" | "md5"): Promise<string>;

  // Permissions (Node driver only)
  chmod(path: string, mode: number): Promise<void>;
  chown?(path: string, uid: number, gid: number): Promise<void>;

  // Root introspection
  getRoot(): string;
  resolve(path: string): string; // resolves relative to root; rejects `../` outside root
}

interface IFileStat {
  path: string;
  size: number;
  type: FileType; // "file" | "directory" | "symlink"
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
  mode?: number;
}
```

## Drivers

| Driver       | Home                                        | Runtime       | Deps                               |
| ------------ | ------------------------------------------- | ------------- | ---------------------------------- |
| `node-fs`    | `node/node-fs.driver.ts`                    | Node          | `node:fs`, `chokidar`, `fast-glob` |
| `memory`     | `core/drivers/memory-file-system.driver.ts` | Every runtime | None                               |
| `r2-adapter` | `worker/drivers/r2-adapter.driver.ts`       | Worker        | `@stackra/storage`                 |
| `kv-adapter` | `worker/drivers/kv-adapter.driver.ts`       | Worker        | env.KV binding                     |

## Node driver — chroot

Every `node-fs` filesystem is confined to its configured `root`:

```typescript
const fs = manager.driver("node"); // root = "./data"

await fs.readFile("config.json"); // reads ./data/config.json — OK
await fs.readFile("../secrets/key.pem"); // throws PathTraversalError
await fs.readFile("/etc/passwd"); // throws PathTraversalError
```

`PathResolver.resolve()` normalises the path + rejects any that escape the root.

## Watch API

```typescript
const watcher = fs.watch("./src", { recursive: true, glob: "*.ts" });

watcher.onChange(({ event, path }) => {
  console.log(event, path); // "add" | "change" | "unlink"
});

// ... later
watcher.close();
```

Node uses chokidar. Memory driver uses in-memory event bus. Worker driver
(R2/KV) has no watch — throws `NotSupportedError`.

## Atomic write

Crash-safe writes via temp-file + rename:

```typescript
await fs.writeAtomic("config.json", JSON.stringify(config, null, 2));
```

Under the hood:

1. Write to `config.json.tmp.<random>`.
2. `fsync` to flush to disk.
3. Atomic `rename` → `config.json`.
4. If step 1 or 2 fails, temp file cleaned up.

## Worker adapters

Workers have no local FS. Two adapters bridge:

- `r2-adapter` — treats an R2 bucket as a filesystem. Paths become object keys.
  Directories are `/`-prefix-searches. `stat` maps to `head`.
- `kv-adapter` — treats env.KV as a filesystem. Value size ≤ 25MB (KV limit).
  Directories are prefix lists.

Both are "filesystem-shaped" — familiar API — but slower than real R2/KV
operations. Recommended: consumers use `@stackra/storage` directly for hot
paths; use `@stackra/file-system/worker` only when the shape helps (config-file
reads, migration playback).

## NestJS decorator

```typescript
@Injectable()
export class ConfigLoader {
  public constructor(@InjectFileSystem() private readonly fs: IFileSystem) {}

  public async load(): Promise<IConfig> {
    return this.fs.readJson("config.yaml");
  }
}
```

## Health indicator

`FileSystemHealthIndicator`:

- Free space on root partition (Node).
- Read + write permission (test file cycle).
- Root directory exists + is writable.

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/logger": "workspace:*",
    "@stackra/storage": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "chokidar": "^4.0.0",
    "fast-glob": "^3.3.0",
  },
  "peerDependenciesMeta": {
    "@stackra/storage": { "optional": true },
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "chokidar": { "optional": true },
    "fast-glob": { "optional": true },
  },
}
```

## Phases

### Phase 1 — Contracts + Scaffold (2 days)

### Phase 2 — Core (3 days)

- [ ] `FileSystemManager`, `PathResolver`, `GlobResolver`.
- [ ] `MemoryFileSystem` driver (in-process).
- [ ] Atomic write helper.
- [ ] Hash helpers (SHA256, MD5).
- [ ] Chroot enforcement.

### Phase 3 — Node driver (3 days)

- [ ] `NodeFsDriver` w/ every core API method.
- [ ] Chokidar-backed watcher.
- [ ] `fast-glob` glob implementation.
- [ ] Stream helpers.

### Phase 4 — Worker adapters (3 days)

- [ ] `R2AdapterDriver` — wraps `@stackra/storage` as FS.
- [ ] `KvAdapterDriver` — wraps env.KV as FS.
- [ ] Document limitations (no watch, no chmod, size limits).

### Phase 5 — NestJS (1 day)

- [ ] `FileSystemModule.forRoot()`.
- [ ] `@InjectFileSystem()` decorator.
- [ ] `FileSystemHealthIndicator`.

### Phase 6 — Testing (1 day)

- [ ] `MockFileSystem` (extends memory driver w/ assertion helpers).
- [ ] `createTempDir()` fixture using `fs.mkdtemp`.

### Phase 7 — Docs + release (1 day)

**Total effort:** 14 days.

## Success criteria

- [ ] 5 subpath exports build cleanly.
- [ ] Node driver round-trips read/write/delete.
- [ ] `../` traversal throws `PathTraversalError`.
- [ ] Atomic write: interrupted mid-write leaves original file intact.
- [ ] Watcher: fs change → callback fires within 100ms.
- [ ] Glob: `**/*.ts` returns all TS files under root.
- [ ] Memory driver: full API works in-process.
- [ ] R2 adapter: filesystem-shaped API works over `@stackra/storage`.

## Cross-references

- ADR-0090, 0091, 0092.
- `.kiro/plans/2026-09-03-storage-package.md` — sibling; object storage.
- `.kiro/plans/2026-09-03-cache-package.md` — StorageStore uses this.
