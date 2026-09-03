/**
 * @file response-format.plugin.ts
 * @module @stackra/nestjs-response/graphql/plugins
 * @description Apollo Server plugin that wraps mutation resolver results
 *   in the standard MutationResponse shape (success, message, data, errors).
 */

/**
 * Apollo Server plugin for formatting mutation responses.
 *
 * Wraps mutation resolver results in the standard `IMutationResponse` shape
 * to provide consistent GraphQL mutation output across the API.
 *
 * @returns Apollo Server plugin configuration object
 */
export function responseFormatPlugin(): Record<string, unknown> {
  return {
    requestDidStart() {
      return {
        /**
         * Hook into the response phase to format mutation results.
         *
         * @param requestContext - The Apollo request context
         */
        willSendResponse(requestContext: {
          response: { body: { kind: string; singleResult?: { data?: Record<string, unknown> } } };
          operation?: { operation?: string };
        }) {
          const { response, operation } = requestContext;

          // Only process mutation operations
          if (operation?.operation !== 'mutation') {
            return;
          }

          // Wrap mutation data in standard response shape
          if (response.body.kind === 'single' && response.body.singleResult?.data) {
            const data = response.body.singleResult.data;

            for (const [key, value] of Object.entries(data)) {
              // Skip if already in MutationResponse format
              if (
                typeof value === 'object' &&
                value !== null &&
                'success' in (value as Record<string, unknown>)
              ) {
                continue;
              }

              // Wrap in standard format
              data[key] = {
                success: true,
                data: value,
              };
            }
          }
        },
      };
    },
  };
}
