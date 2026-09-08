# Search — Migrations and Upgrades

Mappings and analyzers are immutable per index version. Schema changes create `vN+1`, backfill, validate, then atomically switch the alias. Provider upgrades are hidden behind adapters. Reindex jobs support checkpointing and rollback by alias restoration.