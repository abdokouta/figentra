import type { SwaggerThemeNameEnum } from "../enums/swagger-theme-name.enum";

/**
 * Swagger Branding Configuration
 *
 * Custom branding and styling options for Swagger UI.
 *
 * @interface SwaggerBranding
 * @author Nesvel
 * @since 1.0.0
 */
export interface SwaggerBranding {
  /**
   * Swagger UI theme from swagger-themes package
   *
   * Provides pre-built themes for Swagger UI.
   * Can be used independently or combined with customCssUrl.
   *
   * @env SWAGGER_THEME
   * @optional
   * @example SwaggerThemeNameEnum.DARK
   * @example SwaggerThemeNameEnum.DRACULA
   *
   * @see {@link https://www.npmjs.com/package/swagger-themes | swagger-themes}
   */
  theme?: SwaggerThemeNameEnum;

  /**
   * Custom page title
   * @env SWAGGER_SITE_TITLE
   * @default API title + ' - Documentation'
   */
  customSiteTitle: string;

  /**
   * Custom favicon URL
   * @env SWAGGER_FAVICON_URL
   * @default '/favicon.ico'
   */
  customFavIcon: string;

  /**
   * Custom CSS URL for styling
   *
   * If both theme and customCssUrl are provided, they will be concatenated.
   * The theme CSS will be applied first, followed by the custom CSS.
   *
   * @env SWAGGER_CUSTOM_CSS_URL
   * @optional
   */
  customCssUrl?: string;

  /**
   * Custom JavaScript URL
   * @env SWAGGER_CUSTOM_JS_URL
   * @optional
   */
  customJsUrl?: string;

  /**
   * Custom logo URL
   * @env SWAGGER_LOGO_URL
   * @optional
   */
  logoUrl?: string;
}
