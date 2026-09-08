# Search — Data Lifecycle

Search projections are rebuildable and non-authoritative. Retain only fields required for search. Deletion events remove documents; privacy erasure jobs purge matching projections across all aliases. Old index versions are retained only during reindex rollback windows, then deleted. Search does not retain immutable business history.