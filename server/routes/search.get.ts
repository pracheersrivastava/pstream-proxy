/**
 * GET /search - Search metadata passthrough
 *
 * ARCHITECTURE:
 * Flow: App → Proxy (this route) → Internal Backend → Response → App
 * Query: ?q=<query>
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

import { forwardToBackend } from '../utils/backend';

export default defineEventHandler(async (event) => {
  // Forward to internal backend /search endpoint (preserves query params)
  // Falls back to mock data only in dev when ENABLE_PROXY_MOCKS=true
  return forwardToBackend(event, '/search');
});
