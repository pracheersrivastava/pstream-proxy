/**
 * Nitro Configuration for P-Stream Proxy
 */
import process from 'node:process';

export default defineNitroConfig({
  compatibilityDate: '2025-12-17',

  // Runtime config for environment-based configuration
  runtimeConfig: {
    backendInternalUrl: process.env.BACKEND_INTERNAL_URL || 'http://129.159.231.53:3000',
    tmdbApiKey: process.env.TMDB_API_KEY,
    // Mock data ONLY for local development when explicitly enabled
    // Production MUST fail loudly if backend routes are missing
    enableProxyMocks: process.env.ENABLE_PROXY_MOCKS === 'true',
  },

  // Explicitly scan server directory
  scanDirs: ['server'],

  // Server config
  serverAssets: [],

  // Dev server
  devServer: {
    // Port is handled via CLI args in package.json
  },
});
