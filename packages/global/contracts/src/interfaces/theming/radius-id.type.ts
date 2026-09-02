/**
 * @file radius-id.type.ts
 * @module @stackra/contracts/interfaces/theming
 * @description Named radius steps every theme resolves to a rem value.
 *
 *   Six steps mirror HeroUI 3's `apps/docs/src/app/themes/constants.ts`
 *   radius options: none → extra-large. The theming package maps each
 *   id to a concrete CSS value at boot; consumers author the id, not
 *   the rem string, so downstream picker UIs stay stable.
 */

/** Named radius steps supported by every theme. */
export type IRadiusId =
  "none" | "extra-small" | "small" | "medium" | "large" | "extra-large";
