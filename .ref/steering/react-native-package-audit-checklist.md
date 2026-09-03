# React Native package audit checklist

The master per-subpath audit checklist for every `@stackra/*` package's
`./native` subpath. Reviewers walk this doc top-to-bottom against a target
subpath; the `native-platform-reviewer` sub-agent walks it programmatically and
emits reports.

Every check names the steering doc that owns the rule, so the reader can drill
down without opening this doc's inline paraphrase.

Read alongside:

- `frontend-package-audit-checklist.md` — the WEB-side sibling. Every
  Section-Number cross-reference below matches the web checklist so a package
  with both `./react` and `./native` gets consistent audits.
- `frontend-packages.md` — the canonical package shape (ADR-0023).
- `subpath-layering.md` — the core layering contract (`native` never imports
  from `react`).
- `code-standards.md` — folder taxonomy, one-export-per-file, barrels.
- `ui-components.md` — HeroUI Native compound-API rules.
- `browser-safe-imports.md` — the sibling for the web bundle; RN has its own
  equivalent (§10 below).
- `storage-usage.md` — `AsyncStorage` only via `@stackra/storage/native`.
- `frontend-localization.md` — per-package i18n catalogs.

The `native-platform-reviewer` sub-agent is the operational authority for
auditing per-package native subpaths. This doc codifies the rules it walks.

## How to use this doc

- **As a reviewer** — walk each section top-to-bottom against the target
  subpath. Flag every unchecked item. Report goes into a PR comment or
  `.kiro/reports/react-native-*/subpaths/<pkg>-native.md`.
- **As the auditor agent** — the `native-platform-reviewer` reads this doc + the
  target package's `src/native/`, runs every enforcement grep in each referenced
  steering doc, and produces a structured report. Invoke via
  `invoke_sub_agent(name: "native-platform-reviewer", prompt: "Audit @stackra/<pkg>/native")`.
- **As a package author** — walk the checklist before opening a PR that adds or
  touches a `./native` subpath.

The audit is READ-ONLY. Auditor reports never edit source; fixes go through a
follow-up commit by the package author (or `heroui-native-builder`).

## Section 0 — Should this package ship `./native`?

Before auditing an existing native subpath, verify it SHOULD exist. And for
packages without one, verify it correctly doesn't.

- [ ] **0.1** — Package has a runtime concern that RN consumers use (auth,
      storage, network, notifications, UI, i18n, scope, ai, ...).
- [ ] **0.2** — Package's `core/` is cross-platform (imports only DOM-safe
      modules — no `window`, `document`, `localStorage`).
- [ ] **0.3** — Package's public API is meaningful on mobile (a `@stackra/pwa`
      service-worker manager has no RN analog; a `@stackra/csp` policy runtime
      has no RN analog).
- [ ] **0.4** — Verify with the package's owner via ADR or team-lead call.
      Absence of `./native` on a package RN consumers use is a P1 finding;
      presence on a package with no RN concern is a P2.

### Web-only exemption class

Packages that CORRECTLY skip `./native`:

- `@stackra/vite` — Vite build tool, Node-only.
- `@stackra/console` — CLI runtime, Node-only.
- `@stackra/csp` — browser CSP nonce runtime.
- `@stackra/pwa` — browser PWA / service worker.
- `@stackra/coordinator` — Web Locks + BroadcastChannel (no RN analog).
- `@stackra/routing` — routing runtime is React Router; RN uses React
  Navigation. Either ships a `./native` with a different router implementation
  OR delegates to a separate `@stackra/native-routing`.

## Section 1 — Package identity & metadata

Owner: `catalog-manifest.md`.

- [ ] **1.1** — `catalog.json.surfaces` includes `"native"` when the package
      ships `./native`.
- [ ] **1.2** — `package.json.exports` declares a `./native` entry with
      `{ types, import, require }`.
- [ ] **1.3** — `tsup.config.ts` declares a `native` entry with
      `entry: "src/native/index.ts"`.
- [ ] **1.4** — `package.json.peerDependencies` correctly declares
      `react-native` (always optional peer + `peerDependenciesMeta`).
- [ ] **1.5** — `heroui-native` and `heroui-native-pro` peers declared when the
      subpath renders UI (always optional).
- [ ] **1.6** — Every `@react-native-community/*` peer declared for the
      native-only libraries the subpath imports (NetInfo, AsyncStorage,
      SecureStore, etc.), always optional.
- [ ] **1.7** — `expo-*` peers declared when the subpath uses Expo modules
      (`expo-notifications`, `expo-image-picker`, ...) — always optional.
- [ ] **1.8** — `catalog.peer_deps` reflects the native peers.

## Section 2 — Subpath layering

Owner: `subpath-layering.md`.

- [ ] **2.1** — `src/native/` imports nothing from `@/react/` (or relative
      equivalent). Verify:
      `grep -rEn 'from ["'"'"'](@|\.\.?)/react/' frontend/packages/<pkg>/src/native/`
      — zero hits.
- [ ] **2.2** — `src/native/` imports from `src/core/` freely. This is the
      canonical direction.
- [ ] **2.3** — `src/native/` may import from `@stackra/contracts`,
      `@stackra/container`, `@stackra/support` (foundation tier).
- [ ] **2.4** — `src/native/` may import from `@stackra/ui/native`,
      `@stackra/storage/native`, `@stackra/i18n/native`,
      `@stackra/network/native` (canonical native peers routed through their
      native subpaths).
- [ ] **2.5** — `src/native/native-<name>.module.ts` composes
      `<Name>Module.forRoot(options)` — the platform-agnostic core is the
      parent, not a sibling.
- [ ] **2.6** — Native module class is `Native<Name>Module` and file is
      `native-<name>.module.ts`.
- [ ] **2.7** — Native module adds a REAL DI binding (adapter, driver,
      detector). Pure pass-through modules (no `providers`, just forwarding to
      core) are FORBIDDEN — same rule as web (`Web<Pkg>Module` cannot be a
      pass-through).

## Section 3 — Public API discipline

Owner: `code-standards.md` + `contract-reexports.md`.

- [ ] **3.1** — `src/native/index.ts` exports only public symbols (no internal
      helpers, no test doubles).
- [ ] **3.2** — Every folder under `src/native/` has an `index.ts` barrel.
- [ ] **3.3** — Every file exports exactly one symbol (with the family-grouping
      exception for React entities).
- [ ] **3.4** — No `default` exports.
- [ ] **3.5** — File suffix matches export kind (`.component.tsx`, `.hook.ts`,
      `.provider.tsx`, `.context.ts`, `.service.ts`, `.driver.ts`,
      `.adapter.ts`, `.detector.ts`, `.util.ts`, etc.).
- [ ] **3.6** — Folder name matches export category (`services/`, `interfaces/`,
      `components/`, `hooks/`, `providers/`, `adapters/`, `drivers/`,
      `detectors/`, ...).
- [ ] **3.7** — No re-export from `@stackra/contracts` in the native barrel
      (same rule as web).
- [ ] **3.8** — No local `I<Name>Like` structural shim (unless probing a
      third-party global; document the exception inline).
- [ ] **3.9** — No re-export of peer symbols (`react`, `react-native`,
      `heroui-native`, ...) unless the package IS that peer's workspace surface
      (`@stackra/ui/native` is the intentional exception).
- [ ] **3.10** — Cross-platform hooks (used by both `react/` and `native/`) live
      in `src/core/hooks/` and are re-exported from both subpaths. Native-only
      hooks live in `src/native/hooks/`.

## Section 4 — Feature contributions

Owner: `subpath-layering.md` + `module-lifecycle.md`.

- [ ] **4.1** — Native routes register from `native/` via `Native<Pkg>Module`,
      not from `core/`. (When RN routing lands.)
- [ ] **4.2** — Every `forFeature` uses an inline `@Injectable()` registrar
      class implementing `OnApplicationBootstrap` per ADR-0052 §Canonical shape.
- [ ] **4.3** — Every discovery loader implements `OnApplicationBootstrap`.

## Section 5 — Localization

Owner: `frontend-localization.md`.

- [ ] **5.1** — Package that renders user-facing strings on RN ships
      `src/core/i18n/en.json` + `src/core/i18n/ar.json` (same catalogs the web
      subpath consumes — one source of truth per package).
- [ ] **5.2** — No literal English text nodes in native JSX (`>Some Text<`).
- [ ] **5.3** — No literal `accessibilityLabel`, `accessibilityHint`,
      `placeholder`, `title` values — every hit is a `t(...)` call.
- [ ] **5.4** — `useI18n()` wired at runtime; catalogs not dead code.
- [ ] **5.5** — RTL handling is `I18nManager.isRTL`-aware; layouts flip via
      HeroUI Native's built-in RTL support (not by wrapping strings in bidi
      marks).

## Section 6 — Dependencies

Owner: `package-conventions.md` + `subpath-layering.md`.

- [ ] **6.1** — Every native peer in `peerDependencies` is mirrored in
      `devDependencies` (per pnpm requirement).
- [ ] **6.2** — Third-party native peers use `catalog:` (versions pinned in
      `package.json workspaces`).
- [ ] **6.3** — Every native peer is OPTIONAL
      (`peerDependenciesMeta.<dep>.optional: true`).
- [ ] **6.4** — Native-only deps NOT declared as REQUIRED peers on the package's
      `.` entry (web consumers shouldn't install RN deps).
- [ ] **6.5** — No `dependencies` block on the package (rule 6.7 from the web
      audit applies).
- [ ] **6.6** — No hardcoded native dep versions (bare version strings) —
      everything through the catalog.

## Section 7 — Tooling & standards

Owner: `package-conventions.md`.

- [ ] **7.1** — `tsup.config.ts` includes the native entry AND marks every
      `react-native*` + `@react-native-community/*` + `expo-*` +
      `heroui-native*` dep as `external`.
- [ ] **7.2** — `vitest.config.ts` correctly handles the RN
      transformIgnorePatterns for pnpm's `.pnpm/` layout (mirroring the shape in
      `frontend/templates/react-native/jest.config.js`).
- [ ] **7.3** — `tsconfig.json` extends the workspace base + declares
      `"paths": { "@/*": ["./src/*"] }`.
- [ ] **7.4** — `package.json.sideEffects: false` (or CSS-only exception for
      design-system packages).
- [ ] **7.5** — `package.json.exports.<./native>.types` first in the conditional
      exports object.
- [ ] **7.6** — Metro-transformable output — no top-level await, no dynamic
      import of native modules at boot without a guard.

## Section 8 — Documentation

Owner: `documentation.md`.

- [ ] **8.1** — Every source file starts with a top-of-file docblock (`@file`,
      `@module`, `@description`).
- [ ] **8.2** — Every exported symbol has a JSDoc block.
- [ ] **8.3** — Every method / function has `@param` / `@returns` / `@throws`.
- [ ] **8.4** — Package `README.md` documents native usage separately from web
      usage — one runnable example per subpath.
- [ ] **8.5** — Native module docblock states its DI contributions (adapters,
      drivers, detectors registered).
- [ ] **8.6** — Barrels contain only re-exports.

## Section 9 — Testing surface

Owner: `testing.md` + `native-test-engineer.md`.

- [ ] **9.1** — `__tests__/` directory covers native code paths.
- [ ] **9.2** — RN testing uses `@testing-library/react-native` (not
      `@testing-library/react` — different presets).
- [ ] **9.3** — Every native adapter / driver / detector has a happy-path test.
- [ ] **9.4** — Every native component has a jsdom-or-RN-testing-library smoke
      test.
- [ ] **9.5** — Detox E2E tests exist for user-facing screens (when the parent
      app ships them). Deferred if no app exists yet.
- [ ] **9.6** — Mocks for `AsyncStorage`, `NetInfo`, `expo-notifications`,
      `expo-modules-core` are consistent across the workspace (canonical mocks
      in `@stackra/<pkg>/testing`).

## Section 10 — Metro + RN bundle safety

Owner: `browser-safe-imports.md` (RN adaptation) + reviewer-agent charter.

- [ ] **10.1** — Zero web-DOM globals in `src/native/**` (`window`, `document`,
      `localStorage`, `sessionStorage`, `IntersectionObserver`,
      `MutationObserver`, `history`, `navigator.serviceWorker`,
      `navigator.mediaDevices`). Enforcement grep:
      `grep -rEn '\b(window|document|localStorage|sessionStorage)\.' frontend/packages/<pkg>/src/native/`
      — zero hits.
- [ ] **10.2** — Zero `node:*` imports in RN-reachable dist output
      (`dist/native.mjs` / `dist/native.js`).
- [ ] **10.3** — Zero `metro-stubs/` directory in the package.
- [ ] **10.4** — Zero empty-module aliases in the package's contributions to
      Metro's `resolveRequest` (contract stays on the app-side
      `metro.config.js`).
- [ ] **10.5** — Every third-party native module import is a whole
      `import ... from 'expo-xxx'` — not a deep import into internal Expo paths.
- [ ] **10.6** — Every use of `Platform.OS` is guarded with a fallback for the
      "other" platform (or an explicit early return).
- [ ] **10.7** — `require('react-native')` module resolution: file picks the
      right platform variant (`.ios.tsx`, `.android.tsx`, `.native.tsx`) when
      platform-specific behavior is needed.

## Section 11 — Communication + module lifecycle

Same as web checklist §11:

- [ ] **11.1** — No `class *Bootstrap`.
- [ ] **11.2** — No `useFactory` that returns `null` / `true` after a side
      effect.
- [ ] **11.3** — Every emit uses a `*.events.ts` constant.
- [ ] **11.4** — Every `@OnEvent(...)` / `useOnEvent(...)` uses a constant.
- [ ] **11.5** — No service reads React context inside `@Injectable()`.

## Section 12 — Storage + support helpers

Owner: `storage-usage.md` + `support-utilities.md`.

- [ ] **12.1** — Every persistence read/write goes through
      `@stackra/storage/native` (or the shared `IStorageManager` DI token). No
      direct `AsyncStorage.getItem` / `setItem` / `SecureStore.*` outside
      `@stackra/storage/native`'s own drivers.
- [ ] **12.2** — Direct-storage exemptions carry an inline comment (rare on RN —
      Web Locks CAS doesn't apply).
- [ ] **12.3** — String / array / number / URL / env / timing helpers go through
      `@stackra/support`.
- [ ] **12.4** — No direct `process.env.*` / `import.meta.env.*` reads.

## Section 13 — HeroUI Native + component-level a11y

Owner: `ui-components.md` (native adaptation).

- [ ] **13.1** — Every visual component composes primitives from
      `@stackra/ui/native`, never from `heroui-native` or `heroui-native-pro`
      directly.
- [ ] **13.2** — No bespoke CSS class-name literals — only Uniwind (Tailwind for
      React Native) layout utilities + HeroUI components.
- [ ] **13.3** — Single-choice dropdowns use HeroUI Native's `Select` (the RN
      analog to web `ComboBox`; no free-text on RN unless documented).
- [ ] **13.4** — Every component's compound API verified against the HeroUI
      Native MCP `get_component_docs`.
- [ ] **13.5** — Title Case on headings; no ALL-CAPS `uppercase` utility.
- [ ] **13.6** — Icons imported as components from `@stackra/ui/icons` (or
      `@iconify/react-native` when a native icon set is required); never raw SVG
      inline in the JS bundle.
- [ ] **13.7** — Every screen honors Home Indicator + Android navigation bar via
      HeroUI Native's `SafeAreaView` compound or the reference
      `react-native-safe-area-context` provider.
- [ ] **13.8** — Every interactive element (`Pressable`, `TouchableOpacity`) has
      `accessibilityLabel` + `accessibilityRole` + minimum touch-target of 44×44
      (iOS) / 48×48 (Android) per Apple HIG + Material Guidelines.
- [ ] **13.9** — Every screen has a bilingual test — RTL layout renders
      correctly on Arabic locale.

## Section 14 — Shell + tmp discipline

Owner: `shell-commands.md` + `tmp-files.md`.

- [ ] **14.1** — Any package-shipped shell script avoids one-liner `for` /
      `while` loops.
- [ ] **14.2** — Any agent-authored temp file lands under `.tmp/`.

## Section 15 — Native module surface (advanced)

For packages that ship native code (TurboModules, Fabric components, custom
bridges) — not yet applicable to any `@stackra/*` package but codified here for
future work.

- [ ] **15.1** — TurboModule spec files (`.spec.ts` or `.spec.js`) exist for
      every native module, in the codegen format.
- [ ] **15.2** — Old-arch bridge fallback works when `newArchEnabled` is false
      at boot.
- [ ] **15.3** — iOS Objective-C++ / Swift files live under `ios/` at the
      package root; Android Kotlin / Java under `android/`.
- [ ] **15.4** — `podspec` file exists at the package root for iOS autolinking.
- [ ] **15.5** — Android `build.gradle` autolinking config exists.
- [ ] **15.6** — Every native method has: a Jest mock in `<pkg>/jest.setup.ts`,
      a Detox stub for E2E, a happy-path unit test on the JS side.
- [ ] **15.7** — Permissions requested via `RNPermissions` (canonical
      `react-native-permissions` lib) — never a bespoke bridge.
- [ ] **15.8** — Every native module docstring in TS matches the Objective-C
      header + Android Kotlin doc.

## Section 16 — Deep linking

For packages that contribute deep-link routes.

- [ ] **16.1** — Every deep-link-reachable screen is registered in the app-level
      `app.json` intents.
- [ ] **16.2** — iOS `Info.plist` `CFBundleURLTypes` + Universal Links
      (`applinks:` entitlement) declared for the app's domain.
- [ ] **16.3** — Android `AndroidManifest.xml` intent-filter with
      `autoVerify="true"` for App Links.
- [ ] **16.4** — Round-trip tested via `xcrun simctl openurl` (iOS) +
      `adb shell am start` (Android).
- [ ] **16.5** — Fallback route for unregistered paths (route to a typed 404
      screen, not a crash).

## Section 17 — Permissions & purpose strings

- [ ] **17.1** — Every requested iOS permission has a purpose string in
      `Info.plist` (`NSCameraUsageDescription`,
      `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`,
      `NSMicrophoneUsageDescription`, `NSFaceIDUsageDescription`, ...). Bare
      permissions request crashes the app on iOS 14+.
- [ ] **17.2** — Every Android permission declared in `AndroidManifest.xml`.
- [ ] **17.3** — Runtime permission requests have a fallback flow — no "user
      denied permission = app crashes" paths.
- [ ] **17.4** — Sensitive permissions (Location, Contacts, Photos, Camera,
      Microphone, FaceID/TouchID) route through `react-native-permissions` for
      cross-platform consistency.

## Section 18 — Push notifications

For `@stackra/notifications/native` (currently the sole owner).

- [ ] **18.1** — Push token capture wired at boot via
      `Notifications.getExpoPushTokenAsync()` + `getDevicePushTokenAsync()`.
- [ ] **18.2** — Token refresh listener registered (tokens rotate).
- [ ] **18.3** — Foreground handler wired (notifications received while app is
      open).
- [ ] **18.4** — Background handler wired (notifications received while app is
      backgrounded).
- [ ] **18.5** — Notification tap → deep-link route resolution.
- [ ] **18.6** — Badge count sync via `setBadgeCountAsync()`.
- [ ] **18.7** — iOS `Info.plist` `UIBackgroundModes` includes
      `remote-notification`.
- [ ] **18.8** — Android `AndroidManifest.xml` FCM services registered.

## Section 19 — Background tasks

For packages that need background work (sync, notifications, ...).

- [ ] **19.1** — iOS background modes correctly declared (`fetch`,
      `remote-notification`, `background-processing`).
- [ ] **19.2** — Android WorkManager / `expo-background-fetch` wired.
- [ ] **19.3** — Background tasks are IDEMPOTENT + can run offline.
- [ ] **19.4** — Battery impact profile documented (how often the background
      task fires + wall-clock budget).

## Section 20 — Store readiness

For the parent app (currently only the template) — not per-package.

- [ ] **20.1** — iOS `PrivacyInfo.xcprivacy` manifest declares every data type
      the app collects.
- [ ] **20.2** — Google Play Data Safety declaration matches
      `PrivacyInfo.xcprivacy`.
- [ ] **20.3** — App icons at every required resolution (iOS: 1024×1024 + all
      @2x/@3x; Android: mipmap-mdpi through xxxhdpi).
- [ ] **20.4** — Launch screens configured for both platforms.
- [ ] **20.5** — App bundle IDs registered (`com.stackra.<app>` on both sides).
- [ ] **20.6** — Minimum OS versions declared (iOS 15+, Android 24+ per RN
      0.86.0 defaults).
- [ ] **20.7** — Version + build number auto-increment via Fastlane.
- [ ] **20.8** — Signing configured (iOS provisioning profile + Android
      keystore, secrets via Doppler).

## Reporting shape

Auditor emits a structured markdown report:

```
# React Native subpath audit — @stackra/<pkg>/native
Date: <YYYY-MM-DD>
Auditor: native-platform-reviewer

## Summary
- Compliant: X of 20 sections
- Violations: Y (P0: n, P1: n, P2: n, P3: n)
- Warnings: Z
- Sections skipped: <list> (with reason)

## Violations by section

### Section 0 — Should this package ship native?

#### 0.1 VIO — @stackra/auth/native missing despite auth-ui/native shipping
Detail: Auth-ui native subpath consumes auth core which has no native module.
Fix: scaffold NativeAuthModule with SecureStore integration.
Steering: react-native-package-audit-checklist.md §0
Priority: P1

... (repeat per violation)

## Passing checks
Section 1: 6/8
Section 2: 7/7 (subpath layering intact)
...
```

## Priorities

- **P0** — blocks a critical property (Metro can't resolve, bundle crashes,
  native module missing, permission not declared).
- **P1** — breaks a stated invariant with material impact (missing native
  subpath on a package RN apps need, cross-subpath import, browser API leak into
  native, i18n dead-catalog).
- **P2** — drift / consistency (naming, folder placement, catalog drift, missing
  testing helper).
- **P3** — style / nit (docblock gap, minor code-smell).

## Automation gates (planned)

CI runs `native-platform-reviewer` on every PR touching
`frontend/packages/*/src/native/`. Reports land under
`.kiro/reports/native-platform-reviewer/`. Fails on P0; warns on P1+.

Manual invocation:

```
invoke_sub_agent(name: "native-platform-reviewer", prompt: "Audit @stackra/<pkg>/native")
```

Or for the whole workspace:

```
invoke_sub_agent(name: "native-platform-reviewer", prompt: "Audit every native subpath under frontend/packages/*/src/native")
```

## Enforcement grep summary

Zero-hit greps that must pass across the workspace:

```sh
# Web-DOM globals in native code
grep -rEn '\b(window|document|localStorage|sessionStorage|IntersectionObserver|MutationObserver)\.' \
  frontend/packages/*/src/native/

# Direct AsyncStorage / SecureStore outside @stackra/storage/native
grep -rEn "from ['\"](\@react-native-async-storage/async-storage|expo-secure-store)['\"]" \
  frontend/packages/*/src/native/ | grep -v 'frontend/packages/storage/'

# Direct heroui-native import outside @stackra/ui
grep -rEn "from ['\"]heroui-native(-pro)?['\"]" \
  frontend/packages/*/src/native/ | grep -v 'frontend/packages/ui/'

# Cross-subpath imports (native → react)
grep -rEn "from ['\"](@|\.\.?)/react/" \
  frontend/packages/*/src/native/

# Bespoke class-name BEM in native components
grep -rEn 'className="[a-z]+-[a-z]+-[a-z]+"' \
  frontend/packages/*/src/native/

# node:* imports in native dist
find frontend/packages/*/dist/native.* -type f 2>/dev/null | \
  xargs grep -l "from ['\"](node:)?(fs|path|url|os)['\"]" 2>/dev/null

# metro-stubs directories
find frontend/packages/*/metro-stubs -type d 2>/dev/null
```

## Cross-references

- `frontend-package-audit-checklist.md` — the web-side sibling. Every section
  here maps to its web counterpart 1:1.
- `subpath-layering.md` — subpath dependency direction.
- `ui-components.md` — HeroUI compound-API rules (adapt to Native).
- `frontend-packages.md` — ADR-0023 canonical package shape.
- `browser-safe-imports.md` — the web sibling of §10 (Metro bundle safety).
- `storage-usage.md` — canonical persistence rule.
- `frontend-localization.md` — per-package i18n.
- `native-platform-reviewer.md` — the reviewer agent charter.
- `heroui-native-builder.md` — the writer agent charter (UI).
- `native-test-engineer.md` — the writer agent charter (tests).
