# ADR-0039 — Web Application Architecture

## Status
Accepted.

## Decision
Figentra web applications use Vite, React, HeroUI, React Router and Stackra
HTTP/State/Query capabilities where available. Resource UIs are explicitly
implemented by each application.

The Application Registry supplies metadata, capabilities and branding, but
Figentra does not adopt SDUI as the default architecture.

## Consequences
Applications retain full control over UX while sharing platform contracts.
