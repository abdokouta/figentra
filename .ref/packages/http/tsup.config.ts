import { defineBaseConfig } from "@stackra/tsup-config";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    fetch: "src/core/fetch.ts",
    rxjs: "src/core/rxjs.ts",
    actions: "src/actions/index.ts",
    testing: "src/testing/index.ts",
    // Publishable config template — Laravel-style. Consumers can
    // either `import { httpConfig } from "@stackra/http/config"` or
    // copy the file into their own app's `src/config/` for full
    // customization. See ADR-0063 amendment.
    config: "config/http.config.ts",
  },
  {
    external: ["axios", "rxjs"],
    dts: true, // @heroui-pro/react ships broken exports.types
  },
);
