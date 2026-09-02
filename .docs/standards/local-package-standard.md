# Local Package Standard

All shared Stackra runtime and configuration packages live under `packages/*`.

Static configuration sources live under `src/`, and their `package.json` export maps point to `src/*`. The executable `@stackra/tsup-config` remains compiled to `dist`.

Runtime packages:
- `@stackra/container`
- `@stackra/contracts`
- `@stackra/support`
- `@stackra/testing`

Applications consume local packages with `workspace:*`.

Every Vite and native app has `src/app.module.ts` as its DI composition root. Vite boots it from `src/main.tsx`; Expo Router boots it from `app/_layout.tsx`. No application maintains a second `createStackraApplication` factory.
