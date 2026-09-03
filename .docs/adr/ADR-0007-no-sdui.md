# ADR-0007 — No Server-Driven UI

**Status:** SUPERSEDED
**Superseded by:** ADR-0012 — Controlled SDUI and Visual Page Builder

## Historical decision

The original V1 decision was to avoid SDUI because previous implementations created unnecessary complexity and made applications harder to maintain.

That decision is retained as historical context but no longer governs the architecture. ADR-0012 adopts a controlled, schema-driven UI model specifically to support a Shopify/WordPress-class visual page-builder capability without serializing arbitrary UI code.
