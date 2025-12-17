/**
 * GET /home - Home page metadata passthrough
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
  // Forward to internal backend /home endpoint
  return forwardToBackend(event, '/home');
});
