/**
 * @file index.ts
 * @module @stackra/nestjs-response/core/presets
 * @description Barrel export for response presets.
 */

export type { IResponsePreset } from './preset.interface';
export { API_PRESET } from './api.preset';
export { ADMIN_PRESET } from './admin.preset';
export { MOBILE_PRESET } from './mobile.preset';
export { M2M_PRESET } from './m2m.preset';
export { WEBHOOK_PRESET } from './webhook.preset';
