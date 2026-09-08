# Reporting — Security and Authorization

Tenant scope and permissions are derived from trusted RequestContext/IAM, never from report payloads. Query compilation injects mandatory tenant and authorization filters. Metric/report visibility is permission-aware. Sensitive exports are audited. Source-of-truth data remains protected by source services; Reporting receives only reportable projections.