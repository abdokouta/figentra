# Frontend Standards

## Stack

Vite + React + React Router 7 + HeroUI.

## Data

Use internal Query/State/HTTP packages.

Do not introduce another query framework without architectural approval.

## Routing

Use React Router 7.

Resource routes may be generated from application code/metadata, but custom routes remain explicit.

## UI

No SDUI.

No server-provided component trees.

Backend provides:
- data
- permissions
- configuration
- theme tokens

Frontend renders the UI.

## Theme

HeroUI theme tokens can be supplied from application configuration and injected through the application shell.

## Accessibility

UI must follow accessible interaction patterns and semantic HTML.
