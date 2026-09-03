/**
 * @file section-screen.interface.ts
 * @module @stackra/settings/native/screens/section-screen
 * @description Props for {@link SectionScreen}.
 */

/**
 * Props for `<SectionScreen>`.
 */
export interface ISectionScreenProps {
  /**
   * The group key the section belongs to. Falls back to a route
   * param when omitted.
   */
  readonly groupKey?: string;

  /**
   * The section key within the group. Matches an
   * `ISettingVisualGroup.key` (or `.label`, per the Laravel schema).
   * Falls back to a route param when omitted.
   */
  readonly sectionKey?: string;
}
