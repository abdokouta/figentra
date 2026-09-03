/**
 * @file zone.spec.tsx
 * @module @stackra/zones/__tests__/react
 * @description Render tests for the `<Zone>` general-purpose
 *   zone renderer.
 *
 *   Focuses on the empty-guard behaviour codified for the
 *   Phase-D a11y audit §P2.3 — when the resolved order is
 *   empty (no intrinsic children AND no contributions), the
 *   component returns `null` so downstream layout wrappers
 *   don't reserve DOM structure for something that never
 *   renders. Complements the pure-algorithm coverage in
 *   `core/utils/resolve-zone-order` (not shipped in this file
 *   — the `<Zone>` test is a runtime behavioural check that
 *   ties DI + hooks + fragment output together).
 */

// @vitest-environment jsdom

import { TestContainerProvider } from "@stackra/container/testing";
import { ZONE_REGISTRY } from "@stackra/contracts";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Zone } from "../../src/react/components/zone/zone.component";
import { MockZoneRegistry } from "../../src/testing/mock-zone-registry/mock-zone-registry";

afterEach(() => {
  cleanup();
});

describe("<Zone> — empty-children guard (P2.3)", () => {
  it("renders `null` when no intrinsic children and no contributions register", () => {
    // Fresh registry — nothing registered against the zone id.
    const registry = new MockZoneRegistry();

    const { container } = render(
      <TestContainerProvider providers={[[ZONE_REGISTRY, registry]]}>
        <Zone id="test.empty.zone" />
      </TestContainerProvider>,
    );

    // The empty guard flips `<Zone>` from a bare `<>...</>`
    // fragment to `null`. Both effectively render no DOM, but
    // the guard also flips the function's return type to
    // `ReactElement | null` — this assertion pins that behaviour
    // so a future refactor doesn't silently re-introduce a
    // wrapping element that reserves layout space.
    expect(container.firstChild).toBeNull();
  });

  it("renders intrinsic children when they exist", () => {
    // Same clean registry — no contributions.
    const registry = new MockZoneRegistry();

    const { container, getByTestId } = render(
      <TestContainerProvider providers={[[ZONE_REGISTRY, registry]]}>
        <Zone id="test.zone-with-children">
          <span data-testid="intrinsic" id="marker">
            Hello world
          </span>
        </Zone>
      </TestContainerProvider>,
    );

    // Intrinsic child surfaces — the empty-guard did NOT fire.
    expect(container.firstChild).not.toBeNull();
    expect(getByTestId("intrinsic").textContent).toBe("Hello world");
  });

  it("still renders `null` when children evaluate to `null` (conditional child)", () => {
    // Simulates the NavHeader case — the host passes
    // `{condition ? <div>...</div> : null}` as a child. When
    // condition is false, React sees a `null` child which
    // `flattenIntrinsicChildren` silently drops. Combined with
    // no contributions, the resolved order is empty and the
    // guard returns `null`.
    const registry = new MockZoneRegistry();

    const { container } = render(
      <TestContainerProvider providers={[[ZONE_REGISTRY, registry]]}>
        <Zone id="test.zone-with-null-child">{null}</Zone>
      </TestContainerProvider>,
    );

    expect(container.firstChild).toBeNull();
  });
});
