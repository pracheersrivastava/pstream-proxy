/**
 * GET /catalog/:id - Catalog item details passthrough
 *
 * ARCHITECTURE:
 * Flow: App → Proxy (this route) → Internal Backend → Response → App
 * 
 * SECURITY:
 * - Backend remains internal to the proxy layer
 * - Mobile app NEVER calls backend directly
 * 
 * MOCK DATA POLICY:
 * - Mocks exist ONLY for local development
 * - Mocks require BOTH conditions:
 *   1. NODE_ENV !== "production"
 *   2. ENABLE_PROXY_MOCKS=true (explicit opt-in)
 * - Production deployments:
 *   - Backend failures MUST surface as 5xx errors
 *   - NEVER return mock data silently
 *   - Fail loudly to prevent shipping fake data
 */

import { forwardToBackend } from '../../utils/backend';

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
  // Falls back to mock data only in dev when ENABLE_PROXY_MOCKS=true
  return forwardToBackend(event, `/catalog/${id}`);
});
