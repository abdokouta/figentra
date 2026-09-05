# Registry — Registry Taxonomy

The Application Registry is the platform registry of metadata. It must not become one undifferentiated registry. Each catalog has a clear owner and projection.

| Registry | Authority | Registry responsibility |
|---|---|---|
| Application | Registry | application identity/lifecycle |
| Version | Registry | immutable application versions |
| Environment | Registry | deployment environment metadata |
| Service | Application/Platform | sanitized service metadata |
| Route | Application | HTTP route projection |
| Resource/Action | Application | resource/action catalog |
| Permission | IAM | IAM authoritative; Registry projection |
| Event | Service/contracts | event metadata projection |
| Consumer | Service | consumer metadata projection |
| Worker | Runtime/application | worker metadata projection |
| Scheduler | Service | schedule metadata projection |
| Configuration | Service/package | schema/metadata only, never secrets |
| Integration | Integrations | integration capability projection |
| Webhook | Integrations/service | endpoint metadata projection |
| Realtime | Service | channel metadata projection |
| Search | Search | index/query metadata projection |
| Reporting | Reporting | report/dataset metadata projection |
| Deployment | Infrastructure | deployment metadata |
| Branding | Application | validated safe tokens only |

The Registry never overrides an owning domain. It indexes/projections metadata for discovery. IAM remains authoritative for permissions; services remain authoritative for events, consumers, jobs and business capabilities; Infrastructure remains authoritative for deployed infrastructure state.