/**
 * @file index.ts
 * @module @stackra/settings/native
 * @description Public API for the React Native subpath.
 *
 *   Import path: `import { … } from "@stackra/settings/native"`.
 *
 *   Ships the {@link NativeSettingsModule} DI module composed on
 *   top of `SettingsModule.forRoot(...)`, four screens (top-level
 *   settings hub, group detail, visual-section detail, full-screen
 *   field editor), seven reusable components (list, generic row,
 *   field-renderer dispatcher, boolean / select / text /
 *   permission-managed field rows), four native-scoped hooks
 *   (config accessor, translator adapter, React Navigation helper,
 *   system-settings opener), and the {@link AsyncStorageSettingsStore}
 *   convenience class.
 *
 *   Every screen composes HeroUI Native primitives via
 *   `@stackra/ui/native` (never direct `heroui-native` imports per
 *   `.kiro/steering/ui-components.md`), wraps content in
 *   `SafeAreaView` from `react-native-safe-area-context` (HeroUI
 *   Native does not ship one — verified via MCP `list_components`),
 *   routes every string through `useNativeSettingsT()` (bilingual
 *   en/ar catalogs shared with the web subpath under
 *   `src/core/i18n/`), and honours 44×44 minimum touch-target +
 *   accessibility labels on every interactive element.
 *
 *   Persistence routes through `@stackra/storage/native`'s
 *   `IStorageManager` — the settings store never imports
 *   AsyncStorage directly, per `.kiro/steering/storage-usage.md`
 *   §Rule 1.
 */

import "reflect-metadata";

// ════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════
export { NativeSettingsModule } from "./native-settings.module";

// ════════════════════════════════════════════════════════════════════
// Screens
// ════════════════════════════════════════════════════════════════════
export {
  FieldEditorScreen,
  GroupScreen,
  SectionScreen,
  SettingsScreen,
  type IFieldEditorScreenProps,
  type IGroupScreenProps,
  type ISectionScreenProps,
  type ISettingsScreenProps,
} from "./screens";

// ════════════════════════════════════════════════════════════════════
// Components
// ════════════════════════════════════════════════════════════════════
export {
  BooleanFieldRow,
  FieldRenderer,
  PermissionFieldRow,
  SelectFieldRow,
  SettingsList,
  SettingsRow,
  TextFieldRow,
  type IBooleanFieldRowProps,
  type IFieldRendererProps,
  type IPermissionFieldRowProps,
  type ISelectFieldRowProps,
  type ISettingsListProps,
  type ISettingsRowProps,
  type ITextFieldRowProps,
} from "./components";

// ════════════════════════════════════════════════════════════════════
// Hooks
// ════════════════════════════════════════════════════════════════════
export {
  useNativeSettingsConfig,
  useNativeSettingsT,
  useSettingsNavigation,
  useSystemSettings,
  type ISettingsNavigation,
  type IUseSystemSettingsResult,
  type NativeSettingsTranslator,
} from "./hooks";

// ════════════════════════════════════════════════════════════════════
// Stores
// ════════════════════════════════════════════════════════════════════
export { AsyncStorageSettingsStore, type IAsyncStorageSettingsStoreOptions } from "./stores";

// ════════════════════════════════════════════════════════════════════
// DI tokens owned by the native subpath
// ════════════════════════════════════════════════════════════════════
export { NATIVE_SETTINGS_CONFIG } from "./constants";

// ════════════════════════════════════════════════════════════════════
// Constants owned by the native subpath
// ════════════════════════════════════════════════════════════════════
export { DEFAULT_ASYNC_STORAGE_INSTANCE } from "./constants";

// ════════════════════════════════════════════════════════════════════
// Interfaces owned by the native subpath
// ════════════════════════════════════════════════════════════════════
export type {
  INativeSettingsConfig,
  INativeSettingsModuleOptions,
  INativeSettingsScreenNames,
  ISettingsRouteParamList,
  SafeAreaEdge,
} from "./interfaces";
