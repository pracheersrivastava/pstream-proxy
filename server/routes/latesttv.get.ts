/**
 * GET /latesttv - Latest TV Shows
 *
 * Fetches from federated feed and enriches with TMDB metadata.
 */

import { fetchTmdb, mapTmdbToMediaItem } from '../utils/tmdb';

export default defineEventHandler(async (event) => {
  try {
    const feed = await $fetch<any[]>('https://fed-airdate.pstream.mov/latesttv');
    
    if (!Array.isArray(feed)) {
      throw new Error('Invalid feed format');
    }

    // Limit to 20 items
    const items = feed.slice(0, 20);
    
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const tmdbId = item.tmdb_id || item.id;
      if (!tmdbId) return null;
      
      try {
        const details = await fetchTmdb(`/tv/${tmdbId}`);
        return mapTmdbToMediaItem(details, 'tv');
      } catch (e) {
        return null;
      }
    }));
    
    return enrichedItems.filter(i => i !== null);
  } catch (error) {
    console.error('[LatestTV] Error:', error);
    throw createError({
      statusCode: 502,
      message: 'Failed to fetch latest TV shows',
    });
  }
});
