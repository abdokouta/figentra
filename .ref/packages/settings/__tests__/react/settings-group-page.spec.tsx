// @vitest-environment jsdom
/**
 * @file settings-group-page.spec.tsx
 * @module @stackra/settings/__tests__/react
 * @description Page-level render coverage for `<SettingsGroupPage>`.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/react/components/settings-form", () => ({
  SettingsForm: () => null,
}));

import { SettingsGroupPage } from "../../src/react/pages/settings-group-page/settings-group-page.component";

afterEach(cleanup);

describe("<SettingsGroupPage>", () => {
  it("stamps the group key as a data-attribute on the root", () => {
    render(<SettingsGroupPage groupKey="auth" />);
    expect(document.querySelector('[data-settings-group-page="auth"]')).toBeTruthy();
  });

  it("shows the back button + fires onBack when supplied", () => {
    const onBack = vi.fn();
    render(<SettingsGroupPage groupKey="auth" onBack={onBack} />);
    const back = screen.getByRole("button", { name: /back to settings/i });
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("hides the back button when onBack is not supplied", () => {
    render(<SettingsGroupPage groupKey="mail" />);
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
  });
});
