/**
 * @file css.constant.ts
 * @module @stackra/nestjs-swagger/constants
 * @description Default CSS styles for Swagger UI customization.
 */

/**
 * Default CSS applied to Swagger UI.
 * Hides the default topbar and applies spacing improvements.
 */
export const DEFAULT_SWAGGER_CSS = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info { margin: 20px 0; }
  .swagger-ui .scheme-container {
    margin: 20px 0;
    padding: 20px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
  }
  .swagger-ui .opblock-summary-control {
    min-height: 46px;
  }
`;
