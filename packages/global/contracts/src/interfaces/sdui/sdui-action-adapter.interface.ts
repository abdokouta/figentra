/**
 * @file sdui-action-adapter.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Contract for the SDUI action adapter — translates
 *   schema-level `ISduiAction` variants into framework
 *   `IActionDescriptor` calls dispatched through
 *   `ACTION_DISPATCHER` (from `@stackra/actions`).
 *
 *   The React runtime already ships a `useSduiActionAdapter()` hook
 *   in `@stackra/sdui/react/action-adapter`. This contract types the
 *   class-based service surface (registered under
 *   `SDUI_ACTION_ADAPTER`) so non-React consumers can dispatch
 *   schema actions without pulling a React tree in.
 *
 *   Every dispatch resolves through the workspace `IActionDispatcher`,
 *   so schema-triggered side effects inherit the framework's
 *   authorisation pipeline, audit logging, tracing, rate-limiting,
 *   and cancellation — same as any code-authored `useDispatch(...)`
 *   call.
 */

import type { IActionContext } from "../actions/action-context.interface";
import type { IActionResponse } from "../actions/action-response.interface";
import type { ISduiAction } from "./sdui-action.interface";

/**
 * SDUI action adapter — the seam between the schema-authored
 * `ISduiAction` union and the framework `IActionDispatcher`.
 *
 * @example
 * ```typescript
 * const adapter = useOptionalInject<ISduiActionAdapter>(SDUI_ACTION_ADAPTER);
 * const response = await adapter?.dispatch(
 *   { kind: "toast", status: "success", title: "Saved" },
 *   { metadata: { originator: "sdui" } },
 * );
 * ```
 */
export interface ISduiActionAdapter {
  /**
   * Translate a schema-level `ISduiAction` into a framework
   * `IActionDescriptor` and dispatch it through the workspace
   * `IActionDispatcher`.
   *
   * @param action  - Schema-level action from a rendered SDUI node.
   * @param context - Optional action context; the adapter merges its
   *                  own SDUI metadata (originator tag, runtime
   *                  handles) onto whatever the caller supplies.
   * @returns The dispatcher's response envelope — success flag +
   *   optional notification + optional data payload.
   */
  dispatch(
    action: ISduiAction,
    context?: IActionContext,
  ): Promise<IActionResponse>;
}
