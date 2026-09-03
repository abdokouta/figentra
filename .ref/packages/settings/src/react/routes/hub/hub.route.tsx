/**
 * @file hub.route.tsx
 * @module @stackra/settings/react/routes/hub
 * @description `@Route()`-decorated route for the settings hub
 *   landing page.
 */

import { Route } from "@stackra/decorators/routing";
import { BaseRoute } from "@stackra/routing";

import { SettingsHubPage } from "../../pages/settings-hub-page";

@Route({
  id: "settings:hub",
  source: "settings",
  path: "/settings",
  Component: SettingsHubPage,
})
export class SettingsHubRoute extends BaseRoute {}
