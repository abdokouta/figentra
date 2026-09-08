# Reporting — Data Lifecycle

Facts are rebuildable projections. Source deletes/retention events propagate to Reporting. Privacy erasure purges reportable projections and generated artifacts. Old index versions are deleted after rollback retention. PostgreSQL metadata has explicit retention for execution/job history. S3 exports use lifecycle expiration appropriate to report sensitivity.