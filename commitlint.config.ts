/**
 * @file commitlint.config.ts
 * @description
 * Commit-message rules for the stackra-frontend monorepo.
 *
 * Extends `@commitlint/config-conventional` (Conventional Commits) with
 * workspace-specific type + scope conventions for enterprise-grade traceability.
 *
 * Format: `<type>(<scope>): <subject>`
 *   type   — kebab-case, from `type-enum` below
 *   scope  — kebab-case, from `scope-enum` below (optional)
 *   subject — imperative mood, no trailing period
 *
 * Header capped at 120 chars. Body/footer optional.
 *
 * @see https://commitlint.js.org/reference/rules.html
 */
import type { UserConfig } from "@commitlint/types";

const configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Header length — 100 chars matches printWidth from the prettier config.
    "header-max-length": [2, "always", 120],

    // Type must be one of these — extends conventional's defaults with
    // enterprise-grade additions.
    "type-enum": [
      2,
      "always",
      [
        // Feature work
        "feat", // A new feature
        "fix", // A bug fix
        "perf", // Performance improvement
        // Refactor / hygiene
        "refactor", // Code refactor (no behavior change)
        "revert", // Revert of an earlier commit
        "style", // Formatting / whitespace / lint-only
        // Test / infra
        "test", // Adding or updating tests
        "build", // Build system, tsup, tsconfig, vite config
        "ci", // CI/CD pipeline changes
        "chore", // Chores, misc maintenance
        // Docs / dependencies
        "docs", // Documentation only
        "deps", // Dependency updates (pnpm, catalog)
        // Release
        "release", // Version bumps, changesets
      ],
    ],

    "scope-empty": [2, "never"],

    // Scope is required and may name a package/service/workstream.
    // Keep it flexible enough for enterprise package names while enforcing
    // a predictable kebab-case convention.
    "scope-case": [2, "always", "kebab-case"],
    "scope-max-length": [2, "always", 40],

    // Subject: no capital letter start, no trailing period, imperative.
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],

    // Body / footer — encourage but don't enforce.
    "body-leading-blank": [1, "always"],
    "footer-leading-blank": [1, "always"],
    "body-max-line-length": [1, "always", 200],
    "footer-max-line-length": [1, "always", 200],
  },
};

export default configuration;
