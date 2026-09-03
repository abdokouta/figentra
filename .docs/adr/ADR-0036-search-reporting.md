# ADR-0036 — Search and Reporting

## Status

Accepted.

## Decision

Search and reporting are read-side capabilities. They consume stable domain
events/projections rather than directly coupling to every service's private
database.

PostgreSQL remains the default query store. Meilisearch/OpenSearch is selected
per workload where dedicated search functionality is justified. Reporting uses a
fact/metric/report registry with explicit projection ownership.

## Consequences

Operational databases remain bounded-context stores and analytics/search can
evolve independently.
