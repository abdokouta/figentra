/**
 * @file error-format.plugin.ts
 * @module @stackra/nestjs-response/graphql/plugins
 * @description Apollo Server plugin that formats GraphQL errors with
 *   standard error codes and extensions for consistent error handling.
 */

/**
 * Apollo Server plugin for formatting GraphQL errors.
 *
 * Normalizes GraphQL error output to include standard error codes
 * in extensions, ensuring consistent error handling across the API
 * regardless of the error source (validation, auth, domain).
 *
 * @returns Apollo Server plugin configuration object
 */
export function errorFormatPlugin(): Record<string, unknown> {
  return {
    requestDidStart() {
      return {
        /**
         * Hook into the response phase to format errors.
         *
         * @param requestContext - The Apollo request context
         */
        willSendResponse(requestContext: {
          response: {
            body: {
              kind: string;
              singleResult?: {
                errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
              };
            };
          };
        }) {
          const { response } = requestContext;

          if (response.body.kind === 'single' && response.body.singleResult?.errors) {
            response.body.singleResult.errors = response.body.singleResult.errors.map((error) => {
              const extensions = error.extensions ?? {};

              // Ensure a standard error code is present
              if (!extensions['code']) {
                extensions['code'] = 'INTERNAL_ERROR';
              }

              // Add timestamp to all errors
              extensions['timestamp'] = new Date().toISOString();

              return {
                ...error,
                extensions,
              };
            });
          }
        },
      };
    },
  };
}
