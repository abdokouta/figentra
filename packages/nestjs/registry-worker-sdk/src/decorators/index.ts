/**
 * @file decorators/index.ts
 * @description Barrel export for all @figentra/registry declarative class decorators.
 *
 * Each decorator lives in its own file. Import individually for tree-shaking,
 * or import all from this barrel.
 *
 * @example
 * ```ts
 * import { RegisterModule, RegisterResource, RegisterAction } from '@figentra/registry';
 * ```
 */

export { RegisterModule, RegistryModuleDefinition } from "./register-module.decorator";
export { RegisterResource, RegistryResource } from "./register-resource.decorator";
export { RegisterAction, RegistryAction } from "./register-action.decorator";
export { RegisterNavigation, RegistryNavigation } from "./register-navigation.decorator";
export { RegisterCapability, RegistryCapability } from "./register-capability.decorator";
export { RegisterWorkflow, RegistryWorkflow } from "./register-workflow.decorator";
export { RegisterEvent, RegistryEvent } from "./register-event.decorator";
export { RegisterIntegration, RegistryIntegration } from "./register-integration.decorator";
export { RegisterSetting, RegistrySetting } from "./register-setting.decorator";
export { RegisterFeature, RegistryFeature } from "./register-feature.decorator";
export { RegisterWidget, RegistryWidget } from "./register-widget.decorator";
export { RegisterLocalization, RegistryLocalization } from "./register-localization.decorator";
