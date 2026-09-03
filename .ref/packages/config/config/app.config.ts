/**
 * @file app.config.ts
 * @module @stackra/config
 * @description Master application configuration.
 *   This is the top-level config that governs the entire application.
 *   All packages read from this for environment awareness and debug mode.
 *
 *   Inspired by: Laravel config/app.php, MedusaJS medusa-config.ts,
 *   NestJS ConfigService.
 */

export default {
  /*
  |--------------------------------------------------------------------------
  | Application Name
  |--------------------------------------------------------------------------
  |
  | This value is the name of your application. Used in logging context,
  | error reports, notification subjects, and anywhere the app identifies itself.
  |
  */
  name: 'Stackra Application',

  /*
  |--------------------------------------------------------------------------
  | Application Environment
  |--------------------------------------------------------------------------
  |
  | This value determines the "environment" your application is currently
  | running in. This may determine how you prefer to configure various
  | services the application utilizes. Set via APP_ENV environment variable.
  |
  | Supported: "local", "development", "staging", "production", "testing"
  |
  */
  env: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',

  /*
  |--------------------------------------------------------------------------
  | Application Debug Mode
  |--------------------------------------------------------------------------
  |
  | When your application is in debug mode, ALL packages output at the
  | "debug" log level regardless of their individual channel configuration.
  | This is a master override — turn it off in production.
  |
  | When false, each package respects its own configured log level
  | from logging.config.ts.
  |
  */
  debug: process.env.APP_DEBUG === 'true' || process.env.NODE_ENV !== 'production',

  /*
  |--------------------------------------------------------------------------
  | Application URL
  |--------------------------------------------------------------------------
  |
  | The base URL of your application. Used for generating absolute URLs
  | in notifications, emails, and API responses.
  |
  */
  url: process.env.APP_URL ?? 'http://localhost:3000',

  /*
  |--------------------------------------------------------------------------
  | Application Timezone
  |--------------------------------------------------------------------------
  |
  | The default timezone for your application. Used by the scheduler,
  | date formatting, and cron expression evaluation. Uses IANA timezone
  | identifiers (e.g., 'UTC', 'America/New_York', 'Asia/Riyadh').
  |
  */
  timezone: process.env.APP_TIMEZONE ?? 'UTC',

  /*
  |--------------------------------------------------------------------------
  | Application Locale
  |--------------------------------------------------------------------------
  |
  | The default locale for your application. Used by the i18n system
  | for translations and number/date formatting.
  |
  */
  locale: process.env.APP_LOCALE ?? 'en',

  /*
  |--------------------------------------------------------------------------
  | Fallback Locale
  |--------------------------------------------------------------------------
  |
  | The fallback locale when the current locale translation is not available.
  |
  */
  fallbackLocale: 'en',
};
