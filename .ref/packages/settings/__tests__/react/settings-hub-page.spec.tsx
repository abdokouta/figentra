// @vitest-environment jsdom
/**
 * @file settings-hub-page.spec.tsx
 * @module @stackra/settings/__tests__/react
 * @description Page-level render coverage for `<SettingsHubPage>`.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const schemaState: readonly unknown[] = [];
const schemaRef = { current: schemaState as readonly unknown[] };

vi.mock("@/core/hooks/use-settings-schema", () => ({
  useSettingsSchema: (): readonly unknown[] => schemaRef.current,
}));

import { SettingsHubPage } from "../../src/react/pages/settings-hub-page/settings-hub-page.component";

afterEach(() => {
  cleanup();
  schemaRef.current = [];
});

describe("<SettingsHubPage>", () => {
  it("renders the empty-state copy when no groups are registered", () => {
    render(<SettingsHubPage />);
    expect(screen.getByText(/no settings groups/i)).toBeDefined();
  });

  it("renders one card per registered group + fires onSelectGroup on click", () => {
    schemaRef.current = [
      { key: "auth", label: "Authentication", description: "Sign-in + MFA" },
      { key: "mail", label: "Email", description: "SMTP + templates" },
    ];
    const onSelectGroup = vi.fn();
    render(<SettingsHubPage onSelectGroup={onSelectGroup} />);

    expect(screen.getByText("Authentication")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();

    const openButtons = screen.getAllByRole("button", { name: /open/i });
    expect(openButtons.length).toBe(2);
    fireEvent.click(openButtons[0]);
    expect(onSelectGroup).toHaveBeenCalledWith("auth");
  });
});
