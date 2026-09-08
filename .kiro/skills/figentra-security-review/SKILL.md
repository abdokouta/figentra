---
name: figentra-security-review
description: Review Figentra changes for authentication, authorization, tenancy, secrets, SSRF, webhook verification, data exposure, and production security risks.
---

# Figentra Security Review

Verify the complete trust path:

`Gateway prevalidation → service authentication/context → Tenant validation → IAM authorization → domain rules`.

Check:
- no client-controlled identity, tenant, role or permission headers are trusted;
- authorization is performed at the owning service/module boundary;
- tenant isolation applies to every query, command, job, consumer and export;
- secrets are referenced from approved secret infrastructure and never logged;
- webhook signatures are verified using the raw provider payload where required;
- outbound integrations have explicit egress, timeout and SSRF protections;
- file uploads validate type, size, ownership and object access;
- errors do not disclose secrets, credentials, internal topology or cross-tenant data;
- audit records are created for durable governance actions;
- security-sensitive changes have regression tests.

Treat security failures as blocking findings. Do not weaken a security boundary merely to make an implementation easier.