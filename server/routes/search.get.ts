/**
 * GET /search - Search metadata aggregation
 *
 * Proxies search requests to TMDB.
 * Query: ?q=<query>
 */

import { fetchTmdb, mapTmdbToMediaItem } from '../utils/tmdb';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const q = String(query.q || '').trim();

  if (!q) {
    return [];
  }

  try {
    const results = await fetchTmdb<{ results: any[] }>('/search/multi', { query: q });
    
    return results.results
      .filter((i: any) => i.media_type === 'movie' || i.media_type === 'tv')
      .map((i: any) => mapTmdbToMediaItem(i, i.media_type));
  } catch (error) {
    console.error('[Search] Error searching TMDB:', error);
    throw createError({
      statusCode: 502,
      message: 'Failed to search',
    });
  }
});
