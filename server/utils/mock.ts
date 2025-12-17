/**
 * Mock data for development/testing when backend routes aren't available
 * 
 * ============================================================================
 * CRITICAL WARNING - READ THIS:
 * ============================================================================
 * 
 * WHY THIS EXISTS:
 * - Enables local UI development without running backend
 * - Supports testing without external dependencies
 * - Provides realistic sample data for development
 * 
 * GATING RULES:
 * - This mock data is ONLY for local development
 * - Mocks are DISABLED by default
 * - To enable: NODE_ENV !== "production" AND ENABLE_PROXY_MOCKS=true
 * 
 * PRODUCTION BEHAVIOR:
 * - Production deployments MUST NEVER use this data
 * - Backend failures in production MUST surface as 5xx errors
 * - Silent fallbacks to mock data would be a CRITICAL BUG
 * - Users deserve honest errors, not fake success states
 * 
 * ============================================================================
 */

export const mockHomeData = [
  {
    id: '550',
    tmdbId: '550',
    title: 'Fight Club',
    poster: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    overview: 'A ticking-Loss insomnia factory worker and a devil-may-care soapmaker...',
    type: 'movie',
    year: 1999,
    rating: 8.4,
  },
  {
    id: '278',
    tmdbId: '278',
    title: 'The Shawshank Redemption',
    poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    overview: 'Two imprisoned men bond over a number of years...',
    type: 'movie',
    year: 1994,
    rating: 8.7,
  },
  {
    id: '238',
    tmdbId: '238',
    title: 'The Godfather',
    poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    overview: 'The aging patriarch of an organized crime dynasty...',
    type: 'movie',
    year: 1972,
    rating: 8.7,
  },
];

export const mockSearchData = (query: string) => [
  {
    id: '550',
    tmdbId: '550',
    title: `${query} - Fight Club`,
    poster: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    type: 'movie',
    year: 1999,
  },
];

export const mockSourcesData = {
  sources: [
    {
      url: 'https://example.com/stream.m3u8',
      provider: 'mock-provider',
      quality: '1080p',
      type: 'hls',
    },
  ],
};

