# App — family

**Status:** Normative component implementation specification.

## 1. Purpose

React Native/Expo mobile application.

## 2. Boundary and ownership

Own only the responsibilities defined here. Cross-boundary changes require an
ADR. Never write another service database directly.

## 3. Repository/runtime identity

- Path: `apps/family`
- Package: `@figentra/family`
- Version: `0.1.0`
- Type: `n/a`
- Node engine: `n/a`

## 4. Dependencies

Runtime dependencies are production code; dev dependencies are build/test
tooling; peer dependencies are public host contracts only. Do not add
dependencies without a documented responsibility.

### Runtime

- `@expo/ui` `~57.0.14`
- `expo` `~57.0.18`
- `expo-constants` `~57.0.16`
- `expo-dev-client` `~57.0.0`
- `expo-device` `~57.0.1`
- `expo-font` `~57.0.2`
- `expo-glass-effect` `~57.0.1`
- `expo-image` `~57.0.3`
- `expo-linking` `~57.0.8`
- `expo-local-authentication` `~57.0.0`
- `expo-notifications` `~57.0.0`
- `expo-router` `~57.0.17`
- `expo-secure-store` `~57.0.0`
- `expo-splash-screen` `~57.0.8`
- `expo-status-bar` `~57.0.1`
- `expo-symbols` `~57.0.2`
- `expo-system-ui` `~57.0.3`
- `expo-web-browser` `~57.0.2`
- `react` `19.2.3`
- `react-dom` `19.2.3`
- `react-native` `0.86.3`
- `react-native-gesture-handler` `~2.32.0`
- `react-native-reanimated` `4.5.1`
- `react-native-safe-area-context` `~5.7.0`
- `react-native-screens` `~4.26.0`
- `react-native-web` `~0.21.0`
- `react-native-worklets` `0.10.1`
- `@stackra/container` `2.0.0`
- `@stackra/logger` `2.0.0`
- `reflect-metadata` `^0.2.2`

### Development

- `@types/react` `~19.2.2`
- `typescript` `~6.0.3`
- `@stackra/oxlint-config` `1.0.0`
- `@stackra/prettier-config` `1.0.2`
- `@stackra/typescript-config` `1.0.5`
- `oxlint` `^1.58.0`
- `prettier` `^3.9.6`
- `prettier-plugin-tailwindcss` `^0.6.14`
- `vitest` `^4.1.2`
- `@vitest/coverage-v8` `^4.1.2`
- `jsdom` `^26.1.0`

### Peer / optional peer

## 5. Source organization and documentation

- Use explicit `controllers`, `application`, `domain`, `infrastructure`,
  `repositories`, `entities`, `dto`, `interfaces`, `types`, `enums`,
  `constants`, `errors`, `events` and `__tests__` folders only where needed.
- Public interfaces/types/enums/constants use dedicated appropriately named
  files.
- No inline exported contracts in controllers/services.
- Add useful TSDoc/docblocks to every exported symbol, class, public method,
  adapter, repository method, endpoint and non-obvious configuration block.
- Comments explain invariants and architectural reasons, not syntax.

## 6. API contract

- Version routes (`/api/v1/...`).
- Keep controllers/route handlers thin.
- Document HTTP endpoints with OpenAPI/Swagger.
- Use the platform error envelope, pagination, filtering, sorting and
  idempotency conventions.
- Internal HTTP is authenticated S2S traffic; never trust arbitrary identity
  headers.

## 7. Package/application standard

- Explicit public exports and intentional subpaths.
- No accidental wildcard exposure of internals.
- Strict TypeScript from shared configuration.
- TSup where applicable.
- Oxlint + shared config.
- Prettier + shared config.
- Vitest + `__tests__`.
- Public API has TSDoc.

## 8. Frontend/mobile standard

- Vite apps: React 19, Tailwind 4, React Router 7, HeroUI 3.
- Application errors/performance through Sentry.
- `@stackra/logger` and `@stackra/container` for app context/logging.
- Playwright for critical browser flows.
- No private service credentials in bundles.
- API access goes through Gateway.

## 13. Infrastructure/configuration

- Environment names: `development`, `staging`, `production`.
- Non-secret deployment configuration belongs in `cloud.yaml`.
- Secrets are injected at runtime.
- Dockerfiles are production-oriented where applicable.
- Terraform owns infrastructure; generated catalogs/manifests are derived, not
  manually duplicated.

## 14. Current repository inventory

- `.ci/family-build-submit.yml`
- `.claude/settings.json`
- `.doppler.yaml`
- `.gitignore`
- `.vscode/extensions.json`
- `.vscode/settings.json`
- `AGENTS.md`
- `CLAUDE.md`
- `LICENSE`
- `README.md`
- `__tests__/vitest.setup.ts`
- `app.json`
- `assets/expo.icon/Assets/expo-symbol 2.svg`
- `assets/expo.icon/Assets/grid.png`
- `assets/expo.icon/icon.json`
- `assets/images/android-icon-background.png`
- `assets/images/android-icon-foreground.png`
- `assets/images/android-icon-monochrome.png`
- `assets/images/expo-badge-white.png`
- `assets/images/expo-badge.png`
- `assets/images/expo-logo.png`
- `assets/images/favicon.png`
- `assets/images/icon.png`
- `assets/images/logo-glow.png`
- `assets/images/react-logo.png`
- `assets/images/react-logo@2x.png`
- `assets/images/react-logo@3x.png`
- `assets/images/splash-icon.png`
- `assets/images/tabIcons/explore.png`
- `assets/images/tabIcons/explore@2x.png`
- `assets/images/tabIcons/explore@3x.png`
- `assets/images/tabIcons/home.png`
- `assets/images/tabIcons/home@2x.png`
- `assets/images/tabIcons/home@3x.png`
- `assets/images/tutorial-web.png`
- `cloud.yaml`
- `eas.json`
- `metro.config.js`
- `package.json`
- `scripts/reset-project.js`
- `src/app/_layout.tsx`
- `src/app/explore.tsx`
- `src/app/index.tsx`
- `src/components/animated-icon.module.css`
- `src/components/animated-icon.tsx`
- `src/components/animated-icon.web.tsx`
- `src/components/app-tabs.tsx`
- `src/components/app-tabs.web.tsx`
- `src/components/external-link.tsx`
- `src/components/hint-row.tsx`
- `src/components/themed-text.tsx`
- `src/components/themed-view.tsx`
- `src/components/ui/collapsible.tsx`
- `src/components/web-badge.tsx`
- `src/constants/theme.ts`
- `src/global.css`
- `src/hooks/use-color-scheme.ts`
- `src/hooks/use-color-scheme.web.ts`
- `src/hooks/use-theme.ts`
- `src/platform/stackra.ts`
- `tsconfig.json`
- `vitest.config.ts`

## 15. Acceptance checklist

- [ ] Scaffold/runtime matches standard
- [ ] Dependencies justified and correctly classified
- [ ] Public exports complete
- [ ] Source boundaries complete
- [ ] Database/migrations/seeds complete where applicable
- [ ] OpenAPI/HTTP complete where applicable
- [ ] Events/outbox/messaging complete where applicable
- [ ] Authentication/authorization complete
- [ ] Health integrated
- [ ] Logging/telemetry/tracing integrated
- [ ] Cache strategy implemented where required
- [ ] Unit/integration/contract/E2E coverage complete
- [ ] Infrastructure/configuration complete
- [ ] Documentation/docblocks complete
- [ ] No TODO/FIXME/stub/shim/fake provider remains
