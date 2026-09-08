# @figentra/reporting-service

Reporting is the analytical control plane and query engine. It consumes domain events, projects facts/dimensions into Reporting-owned OpenSearch indexes, executes bucket/metric aggregations, evaluates Figentra-defined composed metrics, and produces report/export jobs.

The frontend refers to logical datasets and metric/dimension names; it never knows OpenSearch index names or DSL. Provider access is behind `ReportingQueryProvider`; OpenSearch is the initial provider.