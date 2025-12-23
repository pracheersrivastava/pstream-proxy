/**
 * GET /home - Home page metadata aggregation
 *
 * Aggregates data from TMDB to populate the home screen.
 * Structure matches what the P-Stream app expects:
 * [Hero Item, ...Trending, ...Popular, ...New Releases]
 */

import { fetchTmdb, mapTmdbToMediaItem, MediaItem } from '../utils/tmdb';

export default defineEventHandler(async (event) => {
  try {
    // Fetch data in parallel
    const [trendingMovies, trendingTv, popularMovies, nowPlaying] = await Promise.all([
      fetchTmdb<{ results: any[] }>('/trending/movie/week'),
      fetchTmdb<{ results: any[] }>('/trending/tv/week'),
      fetchTmdb<{ results: any[] }>('/movie/popular'),
      fetchTmdb<{ results: any[] }>('/movie/now_playing'),
    ]);

    // 1. Hero Item (Top Trending Movie)
    const heroRaw = trendingMovies.results[0];
    const hero = mapTmdbToMediaItem(heroRaw, 'movie');

    // 2. Trending (Mix of Movies and TV)
    // Take next 6 movies and top 6 TV shows
    const trendingItems = [
      ...trendingMovies.results.slice(1, 7).map((i: any) => mapTmdbToMediaItem(i, 'movie')),
      ...trendingTv.results.slice(0, 6).map((i: any) => mapTmdbToMediaItem(i, 'tv')),
    ];

    // 3. Popular Movies
    const popularItems = popularMovies.results.slice(0, 12).map((i: any) => mapTmdbToMediaItem(i, 'movie'));

    // 4. New Releases (Now Playing)
    const newReleaseItems = nowPlaying.results.slice(0, 12).map((i: any) => mapTmdbToMediaItem(i, 'movie'));

    // Combine into single array as expected by HomeScreen.tsx
    const response: MediaItem[] = [
      hero,
      ...trendingItems,
      ...popularItems,
      ...newReleaseItems,
    ];

    return response;
  } catch (error) {
    console.error('[Home] Error aggregating data:', error);
    throw createError({
      statusCode: 502,
      message: 'Failed to load home data',
    });
  }
});
