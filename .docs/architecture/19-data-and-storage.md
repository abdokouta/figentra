# 19 — Data and Storage

**Status: FOUNDATION**

## Ownership

Each service owns its authoritative data.

No cross-service direct DB writes.

## PostgreSQL

Primary transactional store.

## RLS

RLS is defense in depth.

It is not a replacement for Figentra IAM.

## Files

Object storage can use:

- Cloudflare R2
- AWS S3

File service owns object metadata and access policy.

## Search

Search is derived.

```text
Source DB
 ↓
event/index pipeline
 ↓
search index
```

Never make search the business source of truth.

## Reporting

Reporting should use derived analytical data rather than running uncontrolled
reporting workloads against transactional databases.
