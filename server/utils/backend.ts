/**
 * Backend Proxy Utility
 *
 * ARCHITECTURE:
 * - Mobile app → Proxy (this layer) → Internal Backend
 * - Backend MUST remain internal and never be exposed publicly
 * - Only explicitly defined metadata routes are proxied
 *
 * MOCK DATA POLICY:
 * - Mock data exists ONLY for local development
 * - Mocks are DISABLED by default
 * - To enable mocks, BOTH conditions must be true:
 *   1. NODE_ENV !== "production"
 *   2. ENABLE_PROXY_MOCKS=true
 * - In production, backend failures MUST surface as errors
 * - Production MUST NEVER silently succeed with fake data
 */

import type { H3Event } from 'h3';
import { mockHomeData, mockSearchData, mockSourcesData } from './mock';

const HOP_BY_HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailers', 'transfer-encoding', 'upgrade', 'host',
]);

function getBackendUrl(): string {
  const config = useRuntimeConfig();
  return (config.backendInternalUrl as string) || 'http://129.159.231.53:3000';
}

/**
 * Determines if mock data is allowed based on environment and configuration.
 * 
 * Mock data is ONLY allowed when BOTH:
 * 1. NOT in production (NODE_ENV !== "production")
 * 2. Explicitly enabled (ENABLE_PROXY_MOCKS=true)
 */
function isMockDataAllowed(): boolean {
  const config = useRuntimeConfig();
  const isProduction = process.env.NODE_ENV === 'production';
  const mocksEnabled = config.enableProxyMocks === true;
  
  // Production MUST fail loudly - never use mocks
  if (isProduction) {
    return false;
  }
  
  // Development requires explicit opt-in
  return mocksEnabled;
}

function extractForwardHeaders(event: H3Event): Record<string, string> {
  const headers: Record<string, string> = {};
  const incomingHeaders = getHeaders(event);

  for (const [key, value] of Object.entries(incomingHeaders)) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && value) {
      headers[key] = value;
    }
  }
  headers['accept'] = 'application/json';
  return headers;
}

export async function forwardToBackend<T = unknown>(
  event: H3Event,
  backendPath: string,
): Promise<T> {
  const backendUrl = getBackendUrl();
  const query = getQuery(event);
  const headers = extractForwardHeaders(event);

  const url = new URL(backendPath, backendUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  console.log(`[Proxy] → GET ${backendPath}`);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Bad Gateway',
        message: 'Unexpected redirect from backend',
      });
    }

    if (!response.ok) {
      const status = response.status;
      console.warn(`[Proxy] Backend returned ${status} for ${backendPath}`);
      
      // Check if mocks are allowed (development + explicitly enabled)
      if (isMockDataAllowed()) {
        console.log(`[Proxy] Mock data enabled - falling back to mock data for ${backendPath}`);
        return getMockData<T>(backendPath, query);
      }
      
      // Production or mocks disabled: fail loudly
      console.error(`[Proxy] Mock data disabled - backend failure will propagate`);
      throw createError({
        statusCode: status >= 500 ? status : 502,
        statusMessage: 'Bad Gateway',
        message: `Backend service unavailable for ${backendPath}`,
      });
    }

    return await response.json() as T;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    console.warn(`[Proxy] Backend unreachable for ${backendPath}`);
    
    // Check if mocks are allowed (development + explicitly enabled)
    if (isMockDataAllowed()) {
      console.log(`[Proxy] Mock data enabled - falling back to mock data for ${backendPath}`);
      return getMockData<T>(backendPath, query);
    }
    
    // Production or mocks disabled: fail loudly
    console.error(`[Proxy] Mock data disabled - propagating backend failure`);
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      message: 'Backend service is unreachable',
    });
  }
}

function getMockData<T>(path: string, query: Record<string, unknown>): T {
  if (path === '/home') {
    return mockHomeData as T;
  }
  if (path === '/search') {
    const q = String(query.q || '');
    return mockSearchData(q) as T;
  }
  if (path === '/sources') {
    return mockSourcesData as T;
  }
  if (path.startsWith('/catalog/')) {
    const id = path.split('/')[2];
    return { ...mockHomeData[0], id, tmdbId: id } as T;
  }
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: `No mock data for ${path}`,
  });
}
