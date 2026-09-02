import { defineBaseConfig } from "@stackra/tsup-config";

export default defineBaseConfig(
  {
    index: "src/index.ts",
    testing: "src/testing/index.ts",
  },
  { dts: true },
);
