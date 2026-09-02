# Terraform Standard

Modules contain:

```text
main.tf
variables.tf
versions.tf
outputs.tf
README.md
```

Environment roots contain provider/backend configuration as appropriate.

Terraform is the infrastructure source of truth. Provider versions are
constrained. Variables, resources and outputs are documented.

Production mutation requires plan/apply policy and change-control.
