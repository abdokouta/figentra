# ADR-0062 — S2S Authorization

**Status:** Accepted

Authentication establishes caller identity. IAM establishes authority.
Protected S2S operations authenticate first, resolve trusted context, then
perform an IAM authorization decision. Authorization remains synchronous.
