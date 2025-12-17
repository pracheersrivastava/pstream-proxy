/**
 * GET /sources - Streaming sources passthrough
 *
 * ARCHITECTURE:
 * Flow: App → Proxy (this route) → Internal Backend → Response → App
 * Query: ?tmdbId=<id>&type=<movie|tv>
 * 
 * SECURITY:
 * - Backend remains internal to the proxy layer
 * - Mobile app NEVER calls backend directly
 * - Mock data only available in development when explicitly enabled
 * - Production failures propagate as errors (no silent mock fallback)
 */

export default defineEventHandler(async (event) => {
  // Forward to internal backend /sources endpoint (preserves query params)
  return forwardToBackend(event, '/sources');
});
