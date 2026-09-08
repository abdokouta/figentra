# Reporting — Architecture

Pipeline: domain events → ingestion → fact/dimension projection → OpenSearch → semantic query compiler → OpenSearch aggregations → Figentra calculation engine → report result → export/render.

Reporting is a read-model and control-plane service. It never becomes the transactional source of truth and never performs generic cross-service database joins at runtime.

Control plane: PostgreSQL. Analytical plane: OpenSearch. Artifact plane: S3. Jobs: SQS/platform scheduler.

Use versioned indexes and aliases. Raw facts are optimized for denormalized analytical access; aggregate indexes are introduced only when repeated high-volume queries justify materialization.