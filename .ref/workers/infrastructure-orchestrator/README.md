# Infrastructure Orchestrator

The Infrastructure Orchestrator is the Figentra infrastructure control plane.
It is intentionally split into two runtimes:

1. **Worker** — HTTP/API authentication, IAM authorization, approval checks,
   job persistence, and Workflow orchestration.
2. **Cloudflare Container** — isolated Terraform runtime with a Linux filesystem,
   Git, Terraform, provider credentials, and Terraform state access.

The Worker never executes shell commands and never accepts arbitrary commands
from callers. The only executable is the fixed `/entrypoint.sh` baked into the
Terraform runner image.

## Why not run Terraform directly in a Worker?

Terraform requires a filesystem, a process runtime, provider binaries/plugins,
state locking, and potentially long-running child processes. Cloudflare Workers
are the wrong execution environment for that binary workload. Cloudflare
Containers provide the required Linux runtime and can be started and controlled
by a Worker.

## Production rule

- `plan` may run without a production mutation approval.
- `apply`/`destroy` require the appropriate IAM permission.
- production mutation additionally requires an approval/change reference.
- Terraform source is pinned to an exact Git commit.
- no arbitrary shell command is accepted over HTTP.
- provider/state secrets are runtime-injected and never persisted in D1.

Cloudflare Containers are currently documented as a Workers capability for
full Linux runtimes and process execution, including explicit `exec()` support.
