/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/expo
 * @description Barrel for Expo module contracts.
 *
 *   The `expo` folder holds structural narrowings of every Expo
 *   module surface consumed by `@stackra/*` native adapters — every
 *   Expo peer stays OPTIONAL in the consumer's peer dependency
 *   table because the workspace-side type contract lives here, not
 *   in each consumer's local shim file.
 *
 *   The audit at
 *   `.kiro/reports/code-standards-steward/2026-07-27-bulk-export-audit.md`
 *   suggested a dedicated `@stackra/native-contracts` package for
 *   this family; that was DEFERRED (see backlog §6.2.2 Family 3
 *   note). Every Expo shim lives here under the `expo/` subfolder
 *   so consumers get a single import path from `@stackra/contracts`.
 */

export type {
  IExpoAuthenticateResult,
  IExpoLocalAuthentication,
} from "./expo-local-authentication.interface";

export type {
  IExpoAuthSessionResult,
  IExpoWebBrowser,
} from "./expo-web-browser.interface";

export type { IExpoSecureStore } from "./expo-secure-store.interface";

export type {
  IExpoNotificationReceivedEvent,
  IExpoNotifications,
  IExpoNotificationsPermissionStatus,
} from "./expo-notifications.interface";

export type { IExpoTaskManager } from "./expo-task-manager.interface";

export type {
  IExpoBackgroundFetch,
  IExpoBackgroundFetchResultEnum,
} from "./expo-background-fetch.interface";
