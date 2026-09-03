/**
 * @file settings-group-page.component.tsx
 * @module @stackra/settings/react/pages/settings-group-page
 * @description `<SettingsGroupPage>` — full-page editor for a single
 *   settings group.
 *
 *   Reads the group by key + delegates rendering to `<SettingsForm>`.
 *   Navigation is router-agnostic via the `onBack` callback.
 */

import { useParams } from "@stackra/routing/react";
import { Button } from "@stackra/ui/react";

import type { ISettingsGroupPageProps } from "./settings-group-page.interface";
import type { ReactElement } from "react";

import { SettingsForm } from "../../components/settings-form";

/**
 * Settings group page — renders the form for a single settings
 * group identified by key.
 *
 * Reads `:groupKey` from the current route via `useParams()`. The
 * optional `groupKey` prop overrides the URL param — useful for
 * tests + Storybook that mount the page outside a router.
 *
 * @param props - See {@link ISettingsGroupPageProps}.
 * @returns The rendered page.
 */
export function SettingsGroupPage(props: ISettingsGroupPageProps = {}): ReactElement {
  const { onBack, className, isReadOnly, isDisabled } = props;
  // Prefer an explicit `groupKey` prop (test path) over the URL
  // param (production path). Fall back to "" so `<SettingsForm>`
  // renders an empty state rather than crashing on an undefined
  // group.
  const urlParams = useParams<{ readonly groupKey?: string }>();
  const groupKey = props.groupKey ?? urlParams.groupKey ?? "";

  return (
    <div
      className={`flex flex-col gap-4 p-6 ${className ?? ""}`.trim()}
      data-settings-group-page={groupKey}
    >
      <header className="flex items-baseline justify-between gap-4">
        {onBack ? (
          <Button size="sm" variant="tertiary" onPress={onBack}>
            Back to Settings
          </Button>
        ) : null}
      </header>

      <SettingsForm group={groupKey} isDisabled={isDisabled} isReadOnly={isReadOnly} />
    </div>
  );
}

SettingsGroupPage.displayName = "SettingsGroupPage";
