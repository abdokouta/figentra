# Production Activation Gates

Repository implementation is complete for the standardization batch, but
provider/account operations remain environment gates.

## External gates

- Provision the real Infrastructure Orchestrator D1/Workflow and deploy its
  Worker/Container runtime.
- Configure production runner secrets through the approved secret manager.
- Run a real development Terraform plan.
- Run a real staging Terraform plan/apply.
- Execute a rollback drill.
- Execute a production approval/change-control test.
- Execute the first production apply.
- Verify live Worker deployments in staging and production.

These cannot be truthfully marked complete from a repository-only execution
without authenticated access to the target Cloudflare, Supabase, NATS, and
secret-management accounts.
