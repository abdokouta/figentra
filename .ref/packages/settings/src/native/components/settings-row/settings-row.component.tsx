/**
 * @file settings-row.component.tsx
 * @module @stackra/settings/native/components/settings-row
 * @description `<SettingsRow>` — a generic tappable `ListGroup.Item`
 *   used by the hub screen to represent one registered group.
 *
 *   Everything else about the row (icon, permission gating, count
 *   badges) is expected to live upstream of this component — the row
 *   itself is intentionally minimal so it composes across the four
 *   screens without accreting shape.
 *
 *   Compound APIs verified via HeroUI Native MCP `get_component_docs`
 *   for ListGroup — see the sibling row components for the shared
 *   `ItemContent > (Title + Description) + ItemSuffix chevron`
 *   pattern.
 */

import { ListGroup } from "@stackra/ui/native";
import type { ReactElement } from "react";

import type { ISettingsRowProps } from "./settings-row.interface";

/**
 * `<SettingsRow>` — a minimal tappable row.
 *
 * @param props - {@link ISettingsRowProps}.
 */
export function SettingsRow(props: ISettingsRowProps): ReactElement {
  const { title, description, onPress, showChevron = true, disabled = false } = props;

  return (
    <ListGroup.Item
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className="min-h-[48px]"
      disabled={disabled}
      onPress={onPress}
    >
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        {description ? <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription> : null}
      </ListGroup.ItemContent>
      {/*
       * Suffix render: HeroUI Native's `ListGroup.ItemSuffix` renders
       * a chevron-right by default. Callers who want a flatter look
       * pass `showChevron={false}` — we drop the suffix in that
       * branch so no chevron slot renders at all.
       */}
      {showChevron ? <ListGroup.ItemSuffix /> : null}
    </ListGroup.Item>
  );
}

SettingsRow.displayName = "SettingsRow";
