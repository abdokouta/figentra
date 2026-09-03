# Pending Migrations

## Scope Migration: tenant_id → owner_id

After the scope system migration, the following ALTER TABLE statements are
needed:

### Entities requiring column rename:

| Entity           | Table               | Change                                                          |
| ---------------- | ------------------- | --------------------------------------------------------------- |
| AuditEntry       | audit_entries       | RENAME COLUMN tenantId → owner_id, ADD scope_node_id UUID NULL  |
| ActivityEntry    | activity_entries    | RENAME COLUMN tenantId → owner_id, ADD scope_node_id UUID NULL  |
| TransferJob      | transfer_jobs       | RENAME COLUMN tenantId → owner_id, ADD scope_node_id UUID NULL  |
| MappingProfile   | mapping_profiles    | RENAME COLUMN tenantId → owner_id, ADD scope_node_id UUID NULL  |
| AiAgentEntity    | ai_agents           | RENAME COLUMN tenant_id → owner_id, ADD scope_node_id UUID NULL |
| AiConversation   | ai_conversations    | RENAME COLUMN tenant_id → owner_id, ADD scope_node_id UUID NULL |
| AiMessage        | ai_messages         | RENAME COLUMN tenant_id → owner_id, ADD scope_node_id UUID NULL |
| AiInsight        | ai_insights         | RENAME COLUMN tenant_id → owner_id, ADD scope_node_id UUID NULL |
| AiToolDefinition | ai_tool_definitions | RENAME COLUMN tenant_id → owner_id, ADD scope_node_id UUID NULL |
| RagDocument      | rag_documents       | RENAME COLUMN tenant_id → owner_id, ADD scope_node_id UUID NULL |

### SQL Template:

```sql
-- For each table:
ALTER TABLE {table_name} RENAME COLUMN tenant_id TO owner_id;
ALTER TABLE {table_name} ADD COLUMN scope_node_id UUID NULL;
CREATE INDEX idx_{table_name}_scope_node_id ON {table_name}(scope_node_id);
```

### Generate:

When PostgreSQL is available, run:

```bash
yarn orm migration:create --name scope-migration
```

This will auto-detect the entity changes and generate the migration file.
