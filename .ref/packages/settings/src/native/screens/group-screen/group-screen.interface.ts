/**
 * @file group-screen.interface.ts
 * @module @stackra/settings/native/screens/group-screen
 * @description Props for {@link GroupScreen}.
 */

/**
 * Props for `<GroupScreen>`.
 */
export interface IGroupScreenProps {
  /**
   * The group key to render. Falls back to a route param
   * (`groupKey`) when omitted — React Navigation's
   * `getParam("groupKey")` shape.
   */
  readonly groupKey?: string;
}
