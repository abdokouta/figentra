/**
 * @file register-widget.decorator.ts
 * @description Annotates a Nest class as a UI widget in the application manifest.
 *
 * Widgets are remotely-renderable UI components exposed by the application.
 * The registry stores the component identifier and version; the component
 * bundle itself is loaded from the application's CDN at runtime.
 *
 * @example
 * ```ts
 * \@RegisterWidget({ key: 'user-count', component: 'UserCountWidget', version: '1.0.0' })
 * \@Injectable()
 * export class UserCountWidgetService {}
 * ```
 */

import type { WidgetManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares a UI widget in the application manifest.
 * @param value - Widget descriptor.
 */
export function RegisterWidget(value: WidgetManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "widget", value);
}

/** @deprecated Use {@link RegisterWidget} instead. */
export const RegistryWidget = RegisterWidget;
