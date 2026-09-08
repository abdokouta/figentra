# Reporting — Migrations and Upgrades

PostgreSQL schema migrations are backward compatible. OpenSearch mapping/analyzer changes create a new index version, backfill and validate, then switch alias. Metric/report versions are immutable once used by an executed report. Provider changes are adapter-level migrations with compatibility tests.