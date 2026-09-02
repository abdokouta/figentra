import { defineBaseConfig } from "@stackra/tsup-config";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    matchers: "src/matchers/index.ts",
    preset: "src/preset/index.ts",
    setup: "src/preset/setup.ts",
    native: "src/native/index.ts",
    "native-setup": "src/native/setup.ts",
  },
  {
    // Every peer + reflect-metadata polyfill stays external — the RN
    // mocks in `native/setup.ts` require these at Jest runtime, not
    // at bundle time. Reflect-metadata is a peer of every downstream
    // Stackra consumer.
    external: [
      "reflect-metadata",
      "@testing-library/react-native",
      "react-native",
      "react-native-reanimated",
      "react-native-reanimated/mock",
      "react-native-gesture-handler",
      "react-native-mmkv",
      "@react-native-async-storage/async-storage",
      "@react-native-async-storage/async-storage/jest/async-storage-mock",
      "@react-native-community/netinfo",
      "@react-native/jest-preset",
      "expo-modules-core",
      "expo-notifications",
      "expo-secure-store",
      "expo-local-authentication",
      "expo-linking",
    ],
    dts: true, // @heroui-pro/react ships broken exports.types
  },
);
