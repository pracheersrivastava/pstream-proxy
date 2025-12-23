/**
 * GET /catalog/:id - Catalog item details aggregation
 *
 * Fetches details from TMDB.
 * Strategy: Try Movie first, then TV.
 */

import { fetchTmdb, mapTmdbToMediaItem } from '../../utils/tmdb';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Missing required parameter: id',
    });
  }

  // Try fetching as movie first
  try {
    const movie = await fetchTmdb(`/movie/${id}`);
    return mapTmdbToMediaItem(movie, 'movie');
  } catch (movieError: any) {
    // If 404, try TV
    if (movieError.statusCode === 404) {
      try {
        const tv = await fetchTmdb(`/tv/${id}`);
        return mapTmdbToMediaItem(tv, 'tv');
      } catch (tvError) {
        throw createError({
          statusCode: 404,
          message: 'Item not found',
        });
      }
    }
    
    console.error(`[Catalog] Error fetching details for ${id}:`, movieError);
    throw createError({
      statusCode: 502,
      message: 'Failed to fetch details',
    });
  }
});
