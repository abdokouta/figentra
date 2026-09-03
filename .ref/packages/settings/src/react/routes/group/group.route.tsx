/**
 * @file group.route.tsx
 * @module @stackra/settings/react/routes/group
 * @description `@Route()`-decorated route for the single-group
 *   settings page.
 *
 *   The page reads `:groupKey` via `useParams()` internally — no
 *   wrapper needed. The @Route decorator points directly at
 *   `SettingsGroupPage`.
 */

import { Route } from "@stackra/decorators/routing";
import { BaseRoute } from "@stackra/routing";

import { SettingsGroupPage } from "../../pages/settings-group-page";

@Route({
  id: "settings:group",
  source: "settings",
  path: "/settings/:groupKey",
  Component: SettingsGroupPage,
})
export class SettingsGroupRoute extends BaseRoute {}
