# Naming Standards

## IDs

Use opaque prefixed IDs where practical:

```text
idn_
prn_
svc_
cred_
role_
perm_
pol_
ten_
scp_
app_
evt_
```

Prefixes are conventions, not security boundaries.

## Permissions

Recommended:

```text
<resource>.<action>
```

Examples:

```text
orders.read
orders.refund
inventory.adjust
```

## Services

Use capability-oriented names:

```text
identity
iam
tenant
scope
registry
domain
billing
entitlements
usage
notifications
integrations
workflow
audit
events
search
reporting
```

Avoid organization-chart names.
