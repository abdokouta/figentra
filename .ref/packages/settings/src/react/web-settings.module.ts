/**
 * @file web-settings.module.ts
 * @module @stackra/settings/react
 * @description `WebSettingsModule` — React/web-runtime binding on
 *   top of {@link SettingsModule}. Composes core + registers the
 *   two `@Route()`-decorated route classes as providers.
 */

import { Module, type DynamicModule } from "@stackra/container";
import type { ISettingsModuleOptions } from "@stackra/contracts";
import { NavigationModule } from "@stackra/navigation";

import { SettingsGroupRoute, SettingsHubRoute } from "./routes";

import { SettingsModule } from "../core/settings.module";

/**
 * Web-runtime binding for `@stackra/settings`.
 */
@Module({})
export class WebSettingsModule {
  public static forRoot(options: ISettingsModuleOptions = {}): DynamicModule {
    return {
      module: WebSettingsModule,
      global: true,
      imports: [
        SettingsModule.forRoot(options),
        NavigationModule.forFeature({
          source: "@stackra/settings",
          menus: [
            {
              menu: {
                id: "settings-primary",
                location: "primary",
                items: [
                  {
                    id: "settings.hub",
                    kind: "link",
                    label: "Settings",
                    to: "/settings",
                    order: 999,
                  },
                ],
              },
              priority: 100,
            },
            {
              menu: {
                id: "settings-account",
                location: "account",
                items: [
                  {
                    id: "settings.appearance",
                    kind: "link",
                    label: "Appearance",
                    to: "/settings/appearance",
                    order: 100,
                  },
                ],
              },
              priority: 100,
            },
          ],
        }),
      ],
      providers: [SettingsHubRoute, SettingsGroupRoute],
      exports: [SettingsModule],
    };
  }
}
