/**
 * @file settings-hub-page.component.tsx
 * @module @stackra/settings/react/pages/settings-hub-page
 * @description `<SettingsHubPage>` — landing page that lists every
 *   registered settings group so users can pick which section to
 *   edit.
 *
 *   Reads the resolved schema via `useSettingsSchema()`. Navigation
 *   is router-agnostic — the caller supplies an `onSelectGroup`
 *   callback that fires with the group key.
 */

import { SETTINGS_ZONES } from "@stackra/contracts";
import { Button, Card } from "@stackra/ui/react";
import { Zone } from "@stackra/zones/react";

import type { ISettingsHubPageProps } from "./settings-hub-page.interface";
import type { ReactElement } from "react";

import { useSettingsSchema } from "../../../core/hooks/use-settings-schema";

/**
 * Settings hub page — lists every registered settings group.
 *
 * @param props - See {@link ISettingsHubPageProps}.
 * @returns The rendered page.
 */
export function SettingsHubPage(props: ISettingsHubPageProps = {}): ReactElement {
  const { onSelectGroup, className } = props;
  const schema = useSettingsSchema();

  if (schema.length === 0) {
    return (
      <div className={`text-muted p-6 ${className ?? ""}`.trim()} data-settings-hub-page="empty">
        No settings groups registered.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 p-6 ${className ?? ""}`.trim()} data-settings-hub-page="">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted text-sm">Choose a category to configure.</p>
      </header>

      <div className="flex flex-col gap-3">
        {/* Cross-cutting settings-groups zone — every workspace module
            contributes its own settings-group card here. Intrinsic
            children are the schema-driven groups (id keyed on
            `group.key`); contributions register via
            `WebXModule.forRoot(...)` inline `@Injectable()` registrar
            per ADR-0052 targeting `SETTINGS_ZONES.HUB_SECTIONS`. */}
        <Zone id={SETTINGS_ZONES.HUB_SECTIONS} params={{}}>
          {schema.map((group) => (
            <Card
              id={`settings-group-${group.key}`}
              key={group.key}
              data-settings-group-card={group.key}
            >
              <Card.Header>
                <Card.Title>{group.label}</Card.Title>
                {group.description ? (
                  <Card.Description>{group.description}</Card.Description>
                ) : null}
              </Card.Header>
              <Card.Footer className="flex justify-end">
                <Button
                  variant="secondary"
                  onPress={() => {
                    onSelectGroup?.(group.key);
                  }}
                >
                  Open
                </Button>
              </Card.Footer>
            </Card>
          ))}
        </Zone>
      </div>
    </div>
  );
}

SettingsHubPage.displayName = "SettingsHubPage";
