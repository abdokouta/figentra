/**
 * @file example.ts
 * @module {{PACKAGE_NAME}}/routes
 * @description Example route handler. Demonstrates the canonical Worker
 *   route shape: a pure function that takes (Request, Env) and returns
 *   Response. Replace with your actual domain routes.
 */

/**
 * Handle an example API request.
 *
 * @param request - The incoming Request.
 * @param env     - Typed Worker environment bindings.
 * @returns A JSON response.
 */
export async function handleExample(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  // Example response — replace with actual logic (D1 query, KV lookup, etc.).
  return Response.json({
    id,
    message: "Example route handler — replace with your domain logic.",
    timestamp: new Date().toISOString(),
  });
}
