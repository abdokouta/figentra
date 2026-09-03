import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

// Create a custom version of the recommended config that doesn't use structuredClone
const recommendedConfig = {
  rules: {
    // Include only the rules that don't require structuredClone
    // These are the core rules from typescript-eslint/eslint-recommended
    "constructor-super": "error",
    "getter-return": "error",
    "no-const-assign": "error",
    "no-dupe-args": "error",
    "no-dupe-class-members": "error",
    "no-dupe-keys": "error",
    "no-new-symbol": "error",
    "no-this-before-super": "error",
    "no-var": "error",
    "prefer-const": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
  },
};

export default defineConfig([
  // Use our custom recommended config instead of the built-in one
  { ...(recommendedConfig as any) },

  // Use the typescript parser config but not the recommended rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Disable rules that conflict with TypeScript features
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-unsafe-function-type": "off", // Allow Function type
      "@typescript-eslint/no-require-imports": "off", // Allow require imports
      "@typescript-eslint/no-unused-expressions": "off", // Allow unused expressions
    },
  },

  // Configuration for non-TypeScript files
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },

  // Ignore patterns
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
]);
