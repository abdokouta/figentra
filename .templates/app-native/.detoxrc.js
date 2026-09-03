/**
 * @file .detoxrc.js
 * @module @academorix/family
 * @description Detox v20 configuration for the Academorix Family app.
 *
 *   The configuration split — apps + devices + configurations — is
 *   Detox's canonical shape per its v20+ docs
 *   (https://wix.github.io/Detox/docs/config/overview):
 *
 *   - `apps.*` — the binary layouts. iOS builds under
 *     `ios/build/Build/Products/Debug-iphonesimulator/*.app`;
 *     Android builds under
 *     `android/app/build/outputs/apk/debug/app-debug.apk`. Both
 *     directories are populated by the `test:e2e:build:*` scripts
 *     via `expo prebuild --platform <ios|android>` +
 *     `xcodebuild` / `gradlew assembleDebug`.
 *   - `devices.*` — the simulator / emulator descriptors. iOS uses
 *     `iPhone 15 Pro` (Detox's default target on Xcode 15+); Android
 *     uses `Pixel_6_API_34` (matches `.kiro/reports/detox-ci-
 *     provisioning-runbook-2026-07-26.md` §Step 4A).
 *   - `configurations.*` — the (app × device) matrix. Only two
 *     configurations ship today — one per platform for the debug
 *     build. Release / preview / prod variants land when EAS
 *     credentials are provisioned (see `e2e/README.md`).
 *
 *   ## Expo prebuild dance
 *
 *   Neither `ios/` nor `android/` is committed to the repo — every
 *   Detox build starts with `expo prebuild --platform <ios|android>`
 *   to materialise the native project. The build scripts in
 *   `package.json` chain the two:
 *
 *     test:e2e:build:ios = pnpm prebuild:ios && detox build ...
 *     test:e2e:build:android = pnpm prebuild:android && detox build ...
 *
 *   ## Test runner
 *
 *   Detox v20+ runs on `jest-circus` via the `testRunner.jest`
 *   config below. The `e2e/jest.config.js` file carries the
 *   test-file glob + reporter + Detox environment setup.
 *
 *   ## Bundle identifiers
 *
 *   Mirror `app.json`:
 *     - iOS: com.academorix.app
 *     - Android: com.academorix.app
 *
 *   These are Detox metadata only — the actual identifiers ship
 *   through Expo's build pipeline into the compiled binaries.
 */

/** @type {Detox.DetoxConfig} */
module.exports = {
  // ────────────────────────────────────────────────────────────
  // Test runner — Jest with Detox's circus environment.
  // ────────────────────────────────────────────────────────────
  testRunner: {
    args: {
      $0: "jest",
      config: "e2e/jest.config.js",
    },
    // Detox's cold-boot on iOS can take up to ~120s the first time
    // the simulator loads. Later runs are ~10-30s. `setupTimeout`
    // covers the cold-boot window.
    jest: {
      setupTimeout: 120000,
    },
  },

  // ────────────────────────────────────────────────────────────
  // Apps — the binary layouts Detox launches.
  // ────────────────────────────────────────────────────────────
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/Academorix.app",
      // The `build` command chain assumes `expo prebuild --platform ios`
      // already ran (see `package.json` `test:e2e:build:ios`). Detox
      // invokes `xcodebuild` directly — no `pod install` step here
      // because prebuild + `bundle exec pod install` (via the app's
      // own prebuild hook) handles it.
      build:
        "xcodebuild -workspace ios/Academorix.xcworkspace" +
        " -scheme Academorix" +
        " -configuration Debug" +
        " -sdk iphonesimulator" +
        " -derivedDataPath ios/build" +
        " -quiet",
    },
    "android.debug": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
      // Assumes `expo prebuild --platform android` already ran.
      // `gradlew assembleDebug` builds the debug APK; the
      // `assembleAndroidTest` target builds the instrumentation
      // runner Detox uses to drive the emulator.
      build: "cd android && ./gradlew assembleDebug assembleAndroidTest" + " -DtestBuildType=debug",
      reversePorts: [8081],
    },
  },

  // ────────────────────────────────────────────────────────────
  // Devices — the simulator / emulator descriptors.
  // ────────────────────────────────────────────────────────────
  devices: {
    // iPhone 15 Pro is Detox's default target on Xcode 15+ and the
    // baseline simulator every macOS dev machine ships.
    "ios.simulator": {
      type: "ios.simulator",
      device: {
        type: "iPhone 15 Pro",
      },
    },
    // Pixel 6 API 34 matches the runbook's canonical AVD name
    // (`.kiro/reports/detox-ci-provisioning-runbook-2026-07-26.md`
    // §Step 4A "Android Linux"). Create the AVD locally via:
    //
    //   avdmanager create avd -n Pixel_6_API_34 \
    //     -k "system-images;android-34;google_apis;x86_64" \
    //     -d pixel_6
    "android.emulator": {
      type: "android.emulator",
      device: {
        avdName: "Pixel_6_API_34",
      },
    },
  },

  // ────────────────────────────────────────────────────────────
  // Configurations — (app × device) matrix.
  // ────────────────────────────────────────────────────────────
  configurations: {
    "ios.sim.debug": {
      device: "ios.simulator",
      app: "ios.debug",
    },
    "android.emu.debug": {
      device: "android.emulator",
      app: "android.debug",
    },
  },

  // ────────────────────────────────────────────────────────────
  // Behaviour — the flags Detox honours across every run.
  // ────────────────────────────────────────────────────────────
  behavior: {
    init: {
      // Detox restarts the app between describe() blocks by default.
      // Leaving `reinstallApp: true` re-installs the binary too on
      // every re-run. Turning it off shaves ~10-15s per run at the
      // cost of stale state — since every spec calls `device.
      // launchApp({ newInstance: true })` explicitly, this is safe.
      reinstallApp: false,
    },
  },

  // ────────────────────────────────────────────────────────────
  // Artifacts — screenshots + logs + videos on failure.
  // ────────────────────────────────────────────────────────────
  artifacts: {
    rootDir: ".artifacts",
    plugins: {
      log: "failing",
      screenshot: "failing",
      // Video recording adds a lot of I/O; keep to failing only.
      // Bump to "all" when triaging a specific flake.
      video: "failing",
    },
  },
};
