// @vitest-environment jsdom
/**
 * @file test-container-provider.spec.tsx
 * @module @stackra/container/__tests__/unit
 * @description Behavioural spec for {@link TestContainerProvider} —
 *   the lightweight `<TestContainerProvider providers={...}>` fixture
 *   downstream packages compose to mount `useInject(...)`-consuming
 *   components in unit tests without booting a real DI graph.
 *
 *   Coverage:
 *   - `useInject(Token)` inside the subtree resolves against the
 *     `[token, value]` pairs the provider was mounted with — verified
 *     for class, symbol, and string tokens.
 *   - Providers pass-through OWN identity — the value the consumer
 *     receives from `useInject` is the same reference the provider
 *     was seeded with (no memoisation drift on identity).
 *   - `useOptionalInject` returns `undefined` for tokens the provider
 *     didn't register.
 *   - A pre-built `MockApplication` (via `createMockApplication`)
 *     merged through the `application` prop shares state with the
 *     provider — `provide` on the app before mounting reaches
 *     `useInject` inside the subtree.
 *   - The `providers` list is merged INTO the pre-built app when
 *     both props are supplied — both bindings visible via
 *     `useInject`.
 *   - Re-rendering the wrapper does not blow away the container —
 *     the same mock instance survives across renders.
 */

import { render, renderHook } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import type { ReactElement } from "react";

import { useInject } from "@/react/hooks/use-inject";
import { useOptionalInject } from "@/react/hooks/use-optional-inject";
import {
  createMockApplication,
  TestContainerProvider,
} from "@/testing";

afterEach(() => cleanup());

// ── Fixtures ────────────────────────────────────────────────────

/** A test-only DI class we resolve by class-token. */
class TestService {
  public constructor(public readonly name = "default") {}
}

/** A test-only symbol token — verifies non-class token resolution. */
const TEST_SYMBOL_TOKEN = Symbol("test.symbol.token");

/** Consumer component that reads a class token and forwards the value. */
function ClassConsumer({
  onResolve,
}: {
  onResolve: (service: TestService) => void;
}): ReactElement {
  const service = useInject(TestService);
  onResolve(service);
  return <div data-testid="class-consumer">{service.name}</div>;
}

/** Consumer component that reads a symbol token. */
function SymbolConsumer({
  onResolve,
}: {
  onResolve: (value: string) => void;
}): ReactElement {
  const value = useInject<string>(TEST_SYMBOL_TOKEN);
  onResolve(value);
  return <div data-testid="symbol-consumer">{value}</div>;
}

/** Consumer component that reads a string token. */
function StringConsumer({
  onResolve,
}: {
  onResolve: (value: number) => void;
}): ReactElement {
  const value = useInject<number>("STRING_TOKEN");
  onResolve(value);
  return <div data-testid="string-consumer">{String(value)}</div>;
}

// ── Suite ───────────────────────────────────────────────────────

describe("<TestContainerProvider />", () => {
  describe("provider prop registration", () => {
    test("resolves a class-token binding via useInject", () => {
      const service = new TestService("via-class-token");
      let captured: TestService | undefined;

      render(
        <TestContainerProvider providers={[[TestService, service]]}>
          <ClassConsumer onResolve={(s) => (captured = s)} />
        </TestContainerProvider>,
      );

      // Same instance the provider was seeded with — identity is
      // preserved end-to-end (no wrapping / no clone).
      expect(captured).toBe(service);
      expect(captured?.name).toBe("via-class-token");
    });

    test("resolves a symbol-token binding via useInject", () => {
      let captured: string | undefined;

      render(
        <TestContainerProvider
          providers={[[TEST_SYMBOL_TOKEN, "symbol-value"]]}
        >
          <SymbolConsumer onResolve={(v) => (captured = v)} />
        </TestContainerProvider>,
      );

      expect(captured).toBe("symbol-value");
    });

    test("resolves a string-token binding via useInject", () => {
      let captured: number | undefined;

      render(
        <TestContainerProvider providers={[["STRING_TOKEN", 42]]}>
          <StringConsumer onResolve={(v) => (captured = v)} />
        </TestContainerProvider>,
      );

      expect(captured).toBe(42);
    });

    test("registers multiple providers in one mount", () => {
      const service = new TestService("multi");
      let capturedClass: TestService | undefined;
      let capturedSymbol: string | undefined;

      render(
        <TestContainerProvider
          providers={[
            [TestService, service],
            [TEST_SYMBOL_TOKEN, "multi-symbol"],
          ]}
        >
          <ClassConsumer onResolve={(s) => (capturedClass = s)} />
          <SymbolConsumer onResolve={(v) => (capturedSymbol = v)} />
        </TestContainerProvider>,
      );

      expect(capturedClass).toBe(service);
      expect(capturedSymbol).toBe("multi-symbol");
    });
  });

  describe("useOptionalInject fallback path", () => {
    test("returns undefined for a token the provider didn't register", () => {
      // Wrap useOptionalInject in a renderHook + TestContainerProvider —
      // if the token isn't bound, `getOptional` returns `undefined`
      // (the fixture doesn't need to register every token every
      // consumer might ask for).
      const { result } = renderHook(() => useOptionalInject(TestService), {
        wrapper: ({ children }) => (
          <TestContainerProvider>{children}</TestContainerProvider>
        ),
      });
      expect(result.current).toBeUndefined();
    });
  });

  describe("application prop — pre-built mock", () => {
    test("shares state with a pre-built MockApplication supplied as `application`", () => {
      // Create the mock first + seed it out-of-band, then hand it
      // to the provider. `useInject` inside the subtree sees the
      // out-of-band binding.
      const app = createMockApplication();
      const service = new TestService("out-of-band");
      app.provide(TestService, service);

      let captured: TestService | undefined;
      render(
        <TestContainerProvider application={app}>
          <ClassConsumer onResolve={(s) => (captured = s)} />
        </TestContainerProvider>,
      );

      expect(captured).toBe(service);
    });

    test("merges `providers` list into a pre-built `application` mock", () => {
      // The prop combination is legitimate — the caller controls the
      // mock (to spy on it later) AND registers a few bindings
      // inline for readability. Both bindings must be reachable.
      const app = createMockApplication();
      const service = new TestService("merged");

      let capturedClass: TestService | undefined;
      let capturedSymbol: string | undefined;

      render(
        <TestContainerProvider
          application={app}
          providers={[
            [TestService, service],
            [TEST_SYMBOL_TOKEN, "merged-symbol"],
          ]}
        >
          <ClassConsumer onResolve={(s) => (capturedClass = s)} />
          <SymbolConsumer onResolve={(v) => (capturedSymbol = v)} />
        </TestContainerProvider>,
      );

      expect(capturedClass).toBe(service);
      expect(capturedSymbol).toBe("merged-symbol");
      // The pre-built app now has both bindings — future assertions
      // against it (e.g. via `createMockApplication`'s assertable
      // proxy) can observe both.
      expect(app.has(TestService)).toBe(true);
      expect(app.has(TEST_SYMBOL_TOKEN)).toBe(true);
    });
  });

  describe("container stability", () => {
    test("re-rendering the wrapper does not rebuild the container", () => {
      // A new value on the useMemo deps would force a fresh
      // MockApplication + re-register — that would break specs
      // that spy on the mock across renders. The provider MUST
      // memoise the container on mount.
      const app = createMockApplication();
      const service = new TestService("stable");
      app.provide(TestService, service);

      const captures: TestService[] = [];
      const { rerender } = render(
        <TestContainerProvider application={app}>
          <ClassConsumer onResolve={(s) => captures.push(s)} />
        </TestContainerProvider>,
      );

      // First render — captures[0].
      expect(captures[0]).toBe(service);

      // Force a re-render with a NEW providers array (different
      // reference, same content). The container inside the
      // provider must NOT reset — same instance survives.
      rerender(
        <TestContainerProvider
          application={app}
          providers={[[TEST_SYMBOL_TOKEN, "not-relevant"]]}
        >
          <ClassConsumer onResolve={(s) => captures.push(s)} />
        </TestContainerProvider>,
      );

      // Second render — captures[1] resolves against the same
      // container, so it's the SAME service reference.
      expect(captures[1]).toBe(service);
      // Note: the memoisation guard means the second render's
      // `providers` list is NOT merged into the pre-existing app —
      // that's the documented contract per the provider's docblock
      // ("swapping props mid-test would blow away every registered
      // value"). Specs that need different bindings remount.
    });
  });
});
