---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: files
version: v1
runtime: nestjs
anchor_adrs: [ADR-0024]
depends_on: ["@stackra/contracts", "@stackra/storage", "@stackra/database", "@stackra/orm", "@stackra/identity", "@stackra/iam", "@stackra/observability"]
---
# Files Service — implementation plan

## Mission and boundary
Files owns the secure lifecycle around binary objects: file metadata, versions, upload/download sessions, access grants, object references, checksum verification, retention and asynchronous processing orchestration. Object bytes live in external object storage selected through `@stackra/storage`; PostgreSQL stores metadata and durable workflow state. Business document semantics stay in the owning domain service.

## Source tree
```text
services/files/src/
├── modules/{files,versions,uploads,downloads,access,lifecycle,checksums,processing,reconciliation}
├── application/{commands,queries,services}
├── domain/{aggregates,value-objects,policies}
├── infrastructure/{database,object-storage,messaging,config}
├── presentation/{http,openapi}
├── workers/{processing,cleanup,reconciliation}
├── database/{entities,migrations}
└── main.ts
```

## Models
`File(id,tenantId,ownerRef,name,mimeType,sizeBytes,classification,status,currentVersion,createdAt,updatedAt)`
`FileVersion(id,fileId,version,sizeBytes,checksum,objectProvider,objectKey,providerVersionId,createdAt)`
`UploadSession(id,fileId,tenantId,provider,objectRef,partCount,expectedSize,expectedChecksum,status,expiresAt,idempotencyKey)`
`AccessGrant(id,fileId,tenantId,principalRef,operation,expiresAt,createdAt,revokedAt)`
`ProcessingJob(id,fileId,processor,status,attempt,nextAttemptAt,resultRef,errorCode,createdAt,updatedAt)`
`FileLifecycle(id,fileId,state,retentionUntil,quarantineReason,deletedAt,version)`

## Public contracts
```ts
interface FileService {
  create(ctx:RequestContext,input:CreateFileInput):Promise<FileView>;
  initiateUpload(ctx:RequestContext,input:InitiateUploadInput):Promise<UploadSessionView>;
  completeUpload(ctx:RequestContext,sessionId:string,input:CompleteUploadInput):Promise<FileView>;
  createDownloadUrl(ctx:RequestContext,fileId:string,input:DownloadOptions):Promise<SignedDownload>;
  delete(ctx:RequestContext,fileId:string):Promise<void>;
}
interface ObjectStoragePort {
  initiateMultipart(input:MultipartInit):Promise<MultipartSession>;
  completeMultipart(input:MultipartComplete):Promise<ObjectReceipt>;
  head(input:ObjectRef):Promise<ObjectMetadata>;
  delete(input:ObjectRef):Promise<void>;
  signedGet(input:ObjectRef,options:SignedUrlOptions):Promise<string>;
}
```

DTOs: `CreateFileDto`, `InitiateUploadDto`, `CompleteUploadDto`, `DownloadRequestDto`, `GrantAccessDto`, `FileQueryDto`, `ProcessingJobDto`, `RetentionPolicyDto`.

## HTTP controllers
```text
POST   /v1/files
GET    /v1/files/:id
DELETE /v1/files/:id
POST   /v1/files/:id/uploads
POST   /v1/files/:id/uploads/:sessionId/complete
POST   /v1/files/:id/download
POST   /v1/files/:id/access
DELETE /v1/files/:id/access/:grantId
GET    /v1/files/:id/processing
POST   /v1/files/reconciliation
```

## Upload execution flow
`create metadata → initiate durable session → issue short-lived provider upload URL/session → client uploads → complete request → verify object exists/size/checksum/type → finalize FileVersion transaction → outbox → processing`. A file is not available to normal consumers until integrity verification succeeds. Completion is idempotent by upload session/idempotency key.

## Object/key policy
Generated key format is `tenant/<tenantId>/file/<fileId>/version/<version>/<random>`. User filenames are metadata only and never form a trusted object path. Canonicalization prevents path traversal. Provider bucket/container and region are deployment configuration, not user-controlled fields.

## Security
Identity supplies principal context. IAM authorizes create/read/write/delete/share operations. Tenant context determines object namespace. Signed URLs are operation-specific and expire quickly. Quarantined files cannot be downloaded. MIME validation, size limits and checksum checks are mandatory. Provider credentials live in secret-manager references. Signed URLs, tokens and object bytes never appear in logs/traces.

## Processing
Processors implement an explicit `FileProcessor` contract and execute through durable worker jobs. Antivirus, transcoding and metadata extraction are isolated by processor capabilities and resource limits. A processor may only access the referenced file/object and declared tenant context. Processor failures are retryable/terminal according to explicit error classification.

## Persistence
PostgreSQL: `files`, `file_versions`, `upload_sessions`, `access_grants`, `processing_jobs`, `file_lifecycle`, `outbox`. Index tenant/status/name, upload expiry, processing status and object references. Binary contents never enter PostgreSQL. Migrations use expand/contract.

## Reliability
Provider outages leave sessions/jobs in explicit recoverable states. Checksum mismatch is terminal and triggers cleanup. Processing uses finite retries + DLQ/quarantine. Orphan reconciliation compares durable object references to provider metadata in bounded batches. Delete uses a lifecycle state before physical object removal where provider consistency requires asynchronous cleanup.

## Runtime roles
`api` handles metadata and signed URL operations; `consumer` handles file processing/lifecycle commands; `worker` processes/scans/cleans/reconciles; `scheduler` expires upload sessions and runs retention. One NestJS service source tree only.

## Observability
Metrics: upload initiation/completion latency, checksum failures, bytes, signed URL issuance, provider errors, processing duration, job lag and orphan counts. OTel spans never include content or signed URLs. Health distinguishes process-up, database-ready and object-storage-ready.

## Testing
Object-storage provider conformance; multipart/partial upload recovery; checksum mismatch; signed URL scope/expiry; IAM access grant enforcement; tenant isolation; concurrent upload completion; quarantine behavior; processor retry/DLQ; orphan reconciliation; retention; migration compatibility; large-file memory bounds.

## Implementation phases
1. Contracts/scaffold/database/object-storage adapters.
2. File/version/upload lifecycle.
3. Download/access/security/checksum enforcement.
4. Processing workers and reconciliation.
5. Retention, observability, failure/load testing.
6. Production deployment and operational recovery runbooks.

## Exit criteria
- Real object storage is used in production; no fake/no-op driver is allowed.
- Upload completion is durable, checksum-verified and idempotent.
- Every download is tenant/IAM-authorized and short-lived.
- Processing and cleanup are durable, bounded and recoverable.
- No binary source of truth exists in PostgreSQL.
