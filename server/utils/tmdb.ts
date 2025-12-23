import type { H3Event } from 'h3';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

export interface MediaItem {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string | null;
  backdrop: string | null;
  overview: string;
  type: 'movie' | 'tv' | 'episode' | 'unknown';
  year?: number;
  rating?: number;
  genres?: string[];
}

export async function fetchTmdb<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  const config = useRuntimeConfig();
  const apiKey = config.tmdbApiKey;

  if (!apiKey) {
    console.error('[TMDB] API key is missing');
    throw createError({
      statusCode: 500,
      message: 'TMDB API key not configured',
    });
  }

  try {
    return (await $fetch<T>(`${TMDB_BASE_URL}${endpoint}`, {
      params: {
        api_key: apiKey,
        ...params,
      },
    })) as T;
  } catch (error: any) {
    console.error(`[TMDB] Error fetching ${endpoint}:`, error.message);
    throw createError({
      statusCode: error.response?.status || 502,
      message: 'Failed to fetch from TMDB',
    });
  }
}

export function mapTmdbToMediaItem(item: any, type: 'movie' | 'tv' = 'movie'): MediaItem {
  const isMovie = type === 'movie' || item.title;
  const title = item.title || item.name || 'Unknown';
  const releaseDate = item.release_date || item.first_air_date;
  const year = releaseDate ? parseInt(releaseDate.substring(0, 4)) : undefined;
  
  return {
    id: String(item.id),
    tmdbId: String(item.id),
    title,
    poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null,
    backdrop: item.backdrop_path ? `${BACKDROP_BASE_URL}${item.backdrop_path}` : null,
    overview: item.overview || '',
    type: isMovie ? 'movie' : 'tv',
    year,
    rating: item.vote_average,
    genres: item.genres?.map((g: any) => g.name),
  };
}
