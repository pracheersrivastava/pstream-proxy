/**
 * GET /catalog/:id - Catalog item details passthrough
 *
 * ARCHITECTURE:
 * Flow: App → Proxy (this route) → Internal Backend → Response → App
 * 
 * SECURITY:
 * - Backend remains internal to the proxy layer
 * - Mobile app NEVER calls backend directly
 * - Mock data only available in development when explicitly enabled
 * - Production failures propagate as errors (no silent mock fallback)
 */

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Missing required parameter: id',
    });
  }

  // Forward to internal backend /catalog/:id endpoint
  return forwardToBackend(event, `/catalog/${id}`);
});
