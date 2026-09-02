/**
 * @file e2e/smoke.spec.ts
 * @description Minimal production-path browser smoke test.
 */
import {expect, test} from "@playwright/test";

test("application renders its document shell", async ({page}) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});
