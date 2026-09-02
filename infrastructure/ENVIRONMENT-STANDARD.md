# Figentra Environment Standard

## Canonical names

The repository uses exactly three canonical environment identifiers:

- `development`
- `staging`
- `production`

These names are the only identifiers accepted by infrastructure contracts, Terraform workspace selection, deployment tooling, and test commands.

## External aliases

External systems may use different identifiers. They are explicit mappings in each canonical environment manifest:

| Canonical | Doppler | Wrangler | Terraform | Local Compose |
|---|---|---|---|---|
| development | `dev` | `development` | `development` | yes |
| staging | `stg` | `staging` | `staging` | yes |
| production | `prd` | `production` | `production` | no |

External aliases are not repository environment names.

## Source of truth

`infrastructure/environments/*.yaml` is the single environment source of truth. Docker and Terraform must consume or validate it; they must not maintain duplicate environment trees.

## Runtime gates

Before deployment, CI must pass the infrastructure contract, CI contract, Docker configuration/build/health tests, and Terraform format/init/validate/plan tests. Production apply remains manually approved.
