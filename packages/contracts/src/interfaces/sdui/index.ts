/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Barrel for the Server-Driven UI wire contract.
 */

export type { SduiScalar, SduiJsonValue } from "./sdui-primitive.type";
export type {
  ISduiExpression,
  ISduiExpressionPath,
  ISduiExpressionOp,
  SduiBindable,
  SduiOperator,
} from "./sdui-expression.interface";
export type {
  ISduiAction,
  ISduiNavigateAction,
  ISduiOpenOverlayAction,
  ISduiCloseOverlayAction,
  ISduiSetStateAction,
  ISduiToggleStateAction,
  ISduiSubmitFormAction,
  ISduiCallApiAction,
  ISduiToastAction,
} from "./sdui-action.interface";
export type { ISduiNode, SduiInteractionEvent } from "./sdui-node.interface";
export type {
  ISduiThemeDocument,
  SduiThemeTokenName,
} from "./sdui-theme.interface";
export type {
  ISduiScreen,
  ISduiDataSource,
  ISduiEvalScope,
  ISduiEvalLocaleSlice,
} from "./sdui-screen.interface";
export type { ISduiClient } from "./sdui-client.interface";
export type { ISduiRuntime, ISduiNotification } from "./sdui-runtime.interface";
export type { ISduiComponentEntry } from "./sdui-component-entry.interface";
export type { ISduiLayoutEntry } from "./sdui-registry.interface";
export type { ISduiComponentRegistry } from "./sdui-component-registry.interface";
export type { ISduiLayoutRegistry } from "./sdui-layout-registry.interface";
export type {
  ISduiComponentSource,
  ISduiHydrationTarget,
} from "./sdui-component-source.interface";
export type { ISduiModuleOptions } from "./sdui-module-options.interface";
export type {
  ISduiPageDescriptor,
  ISduiPageResolution,
} from "./sdui-page-resolution.interface";
export type { ISduiPageRegistry } from "./sdui-page-registry.interface";
export type { ISduiDataSourceResolver } from "./sdui-data-source-resolver.interface";
export type { ISduiRouteSync } from "./sdui-route-sync.interface";
export type { ISduiActionAdapter } from "./sdui-action-adapter.interface";
export type {
  ISduiBackground,
  ISduiBorder,
  ISduiGradient,
  ISduiGradientStop,
  ISduiImageBackground,
  ISduiImageOverlay,
  ISduiSectionStyle,
  ISduiSpacing,
  SduiColor,
  SduiSpacingStep,
} from "./sdui-style.interface";
export type { ISduiResource } from "./sdui-resource.interface";
export type {
  ISduiResourceCatalog,
  ISduiResourceCatalogClient,
} from "./sdui-resource-catalog.interface";
