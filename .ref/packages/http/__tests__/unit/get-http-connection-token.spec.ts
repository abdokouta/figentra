/**
 * @file get-http-connection-token.spec.ts
 * @module @stackra/http/__tests__/unit
 * @description Behavioural spec for `getHttpConnectionToken(name?)`.
 *
 *   The default-arg contract shifted on 2026-07-27: previously
 *   `getHttpConnectionToken()` (no arg) returned
 *   `Symbol.for("HTTP_CONNECTION_default")` — a named token
 *   requiring the app to declare a connection LITERALLY named
 *   `"default"`. That contradicted the workspace's canonical shape
 *   of `config.default: "api"` + `connections: { api: {...} }`
 *   (where `default` NAMES which connection is the app's default),
 *   causing `SessionService` and every `@InjectHttp()` (no arg)
 *   consumer to fail resolution at container init.
 *
 *   The new contract: `getHttpConnectionToken()` (no arg) returns
 *   `DEFAULT_HTTP_CONNECTION_TOKEN` — the workspace-wide fixed
 *   symbol every `HttpModule.forRoot()` always registers, mapping
 *   to whatever the app chose as its default connection.
 */

import {
  DEFAULT_HTTP_CONNECTION_TOKEN,
  getHttpConnectionToken,
} from "@stackra/contracts";
import { describe, expect, it } from "vitest";

// `getHttpConnectionToken` lives in `@stackra/contracts` as the single
// source of truth (the duplicate local copy at
// `@stackra/http/utils/get-http-connection-token.util.ts` was deleted
// on 2026-07-27 to prevent the divergence that caused §2.20 to leak
// past the initial fix).

describe("getHttpConnectionToken", () => {
  it("returns DEFAULT_HTTP_CONNECTION_TOKEN when called with no argument", () => {
    // Workspace-wide fixed symbol that HttpModule always registers
    // as an alias for `config.default` — makes `@InjectHttp()` (no
    // arg) work regardless of what the app named its default
    // connection.
    expect(getHttpConnectionToken()).toBe(DEFAULT_HTTP_CONNECTION_TOKEN);
  });

  it("returns Symbol.for('HTTP_CONNECTION_<name>') for a named connection", () => {
    expect(getHttpConnectionToken("billing")).toBe(
      Symbol.for("HTTP_CONNECTION_billing"),
    );
    expect(getHttpConnectionToken("auth")).toBe(
      Symbol.for("HTTP_CONNECTION_auth"),
    );
  });

  it("returns the same symbol for the same name (identity stable)", () => {
    expect(getHttpConnectionToken("api")).toBe(getHttpConnectionToken("api"));
  });

  it("returns different symbols for different names", () => {
    expect(getHttpConnectionToken("a")).not.toBe(getHttpConnectionToken("b"));
  });

  it("does NOT return HTTP_CONNECTION_default even for the literal string 'default'", () => {
    // Consumers who genuinely need a named connection called "default"
    // pass the literal string and get the named token. This is the
    // rare case — most apps use the no-arg default-connection lookup.
    expect(getHttpConnectionToken("default")).toBe(
      Symbol.for("HTTP_CONNECTION_default"),
    );
    // But that's a DIFFERENT symbol from what the no-arg call returns:
    expect(getHttpConnectionToken()).not.toBe(
      getHttpConnectionToken("default"),
    );
  });
});
