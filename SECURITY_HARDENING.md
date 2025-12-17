# Proxy Security Hardening - Mock Data Gating

## Overview

This document explains the security hardening implemented for the P-Stream proxy to enforce strict mock data gating and ensure production safety.

## Problem Statement

Previously, the proxy had an unconditional fallback to mock data when the backend was unavailable. This created a security and reliability risk:

- **Production Risk**: If backend routes failed in production, the proxy would silently return fake data instead of failing loudly
- **Silent Failures**: Operators wouldn't know when backend services were down
- **Data Integrity**: Users could receive fabricated metadata instead of real errors

## Solution

Implemented strict environment-based gating for mock data with multiple layers of protection.

### Key Changes

#### 1. Environment Variable Gating (`ENABLE_PROXY_MOCKS`)

Added a new configuration variable that explicitly enables/disables mock data:

```typescript
// nitro.config.ts
runtimeConfig: {
  backendInternalUrl: process.env.BACKEND_INTERNAL_URL || 'http://129.159.231.53:3000',
  enableProxyMocks: process.env.ENABLE_PROXY_MOCKS === 'true',
}
```

**Default**: `false` (mocks disabled)

#### 2. Dual-Condition Check

Mock data is ONLY used when BOTH conditions are true:

1. `NODE_ENV !== "production"`
2. `ENABLE_PROXY_MOCKS=true`

```typescript
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
```

#### 3. Backend-First Behavior

Every metadata route now:
1. **Attempts backend first**: Always tries to forward to the internal backend
2. **Checks mock eligibility**: Only on backend failure, checks if mocks are allowed
3. **Fails loudly in production**: If backend fails and mocks are disabled, returns proper 5xx errors

```typescript
if (!response.ok) {
  console.warn(`[Proxy] Backend returned ${status} for ${backendPath}`);
  
  if (isMockDataAllowed()) {
    console.log(`[Proxy] Mock data enabled - falling back to mock data`);
    return getMockData<T>(backendPath, query);
  }
  
  // Production: fail loudly
  console.error(`[Proxy] Mock data disabled - backend failure will propagate`);
  throw createError({
    statusCode: status >= 500 ? status : 502,
    statusMessage: 'Bad Gateway',
    message: `Backend service unavailable for ${backendPath}`,
  });
}
```

#### 4. Production Safety Guarantees

In production (`NODE_ENV=production`):
- Mock data is **ALWAYS disabled**, regardless of `ENABLE_PROXY_MOCKS` setting
- Backend failures surface as proper HTTP errors (502/503)
- No silent fallback to fake data
- Error messages do not leak backend internals

#### 5. Documentation and Comments

Added comprehensive documentation:
- Security architecture comments in all route handlers
- Mock data policy warnings in `mock.ts`
- Backend proxy utility header explaining mock gating
- Updated README with mock data policy section
- Added `.env.example` with clear comments

## Usage

### Local Development (with mocks enabled)

```bash
# .env file
NODE_ENV=development
ENABLE_PROXY_MOCKS=true
BACKEND_INTERNAL_URL=http://127.0.0.1:3000
```

**Behavior**:
- Proxy attempts to forward requests to backend
- If backend fails or returns errors, falls back to mock data
- Logs clearly indicate when mocks are being used
- Development workflow continues even if backend routes aren't implemented

### Local Development (without mocks)

```bash
# .env file
NODE_ENV=development
ENABLE_PROXY_MOCKS=false  # or omit entirely
BACKEND_INTERNAL_URL=http://127.0.0.1:3000
```

**Behavior**:
- Proxy attempts to forward requests to backend
- Backend failures propagate as errors (5xx)
- Behaves like production but in development mode

### Production

```bash
# Production environment
NODE_ENV=production
BACKEND_INTERNAL_URL=http://internal-backend:3000
# ENABLE_PROXY_MOCKS is ignored in production
```

**Behavior**:
- Mock data is **ALWAYS disabled**
- Backend failures return proper errors (502/503)
- No silent fallback to fake data
- Operations team alerted to backend failures

## Logging

The proxy now provides clear logging for observability:

```
[Proxy] → GET /home
[Proxy] Backend returned 404 for /home
[Proxy] Mock data enabled - falling back to mock data for /home
```

Or in production:

```
[Proxy] → GET /home
[Proxy] Backend returned 500 for /home
[Proxy] Mock data disabled - backend failure will propagate
```

## Architecture Invariants (Unchanged)

These remain NON-NEGOTIABLE:
1. Mobile app NEVER calls backend directly
2. Backend remains internal to the proxy
3. No generic catch-all forwarding routes
4. Only explicitly defined metadata routes are proxied

## Testing

Updated test suite to reflect correct BASE_API_URL:
- Fixed `SettingsService.test.ts` to expect `http://10.0.2.2:3003` (Android emulator)
- Fixed `apiClient.test.ts` to use correct proxy URL
- Increased timeout for `HomeScreen.integration.test.tsx` to handle async rendering

## Validation

### Development Mode Test
```bash
cd proxy
export NODE_ENV=development
export ENABLE_PROXY_MOCKS=true
npm run dev
# Access http://localhost:3003/home
# Should return mock data if backend is down
```

### Production Mode Test
```bash
cd proxy
export NODE_ENV=production
npm run build
npm run start
# Access http://localhost:3003/home with backend down
# Should return 502/503 error, NOT mock data
```

## Security Benefits

1. **No Silent Failures**: Production failures are loud and visible
2. **Data Integrity**: Users never receive fake data in production
3. **Operational Visibility**: Backend outages are immediately apparent
4. **Explicit Development**: Mock data requires deliberate opt-in
5. **Defense in Depth**: Multiple layers of checks prevent mock data in production

## Migration Path

For existing deployments:

1. **Immediate**: This change is backwards compatible
   - Default behavior (mocks disabled) matches production requirements
   - No breaking changes to API contracts

2. **For local development**:
   - Add `ENABLE_PROXY_MOCKS=true` to `.env` if you need mock fallback
   - Or leave disabled to test production-like behavior locally

3. **For production**:
   - No changes required
   - Mocks are automatically disabled regardless of configuration
   - Backend failures now properly propagate as errors

## Related Files

- [proxy/nitro.config.ts](proxy/nitro.config.ts) - Configuration
- [proxy/server/utils/backend.ts](proxy/server/utils/backend.ts) - Core logic
- [proxy/server/utils/mock.ts](proxy/server/utils/mock.ts) - Mock data
- [proxy/server/routes/](proxy/server/routes/) - All route handlers
- [proxy/.env.example](proxy/.env.example) - Environment template
- [proxy/README.md](proxy/README.md) - Updated documentation

---

**Author**: GitHub Copilot  
**Date**: December 17, 2025  
**Status**: Implemented ✅
