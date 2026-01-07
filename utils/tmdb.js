const TMDB_API_KEY = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_TMDB_API_KEY)
  ? process.env.EXPO_PUBLIC_TMDB_API_KEY
  : '91afbb37cddf26d178a7483604f6333c';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json();
}

function mapToAppMovie(details, credits) {
  const director = credits?.crew?.find(c => c.job === 'Director')?.name || 'N/A';
  const genres = details?.genres?.map(g => g.name).join(', ') || 'N/A';
  const poster = details?.poster_path ? `${TMDB_IMG}${details.poster_path}` : 'N/A';
  return {
    Title: details?.title || details?.name || 'Unknown',
    Poster: poster,
    imdbRating: details?.vote_average ? Number(details.vote_average).toFixed(1) : 'N/A',
    Genre: genres,
    Plot: details?.overview || 'No overview available',
    Director: director,
    Year: details?.release_date || '',
    tmdbId: details?.id,
  };
}

export async function getMovieDetailsById(id) {
  const details = await fetchJson(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`);
  const credits = await fetchJson(`${TMDB_BASE}/movie/${id}/credits?api_key=${TMDB_API_KEY}&language=en-US`);
  return mapToAppMovie(details, credits);
}

export async function searchMovieByTitle(title) {
  const q = encodeURIComponent(title.trim());
  const search = await fetchJson(`${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${q}&page=1&include_adult=false`);
  if (!search?.results?.length) return null;
  // Take best match
  const best = search.results[0];
  return getMovieDetailsById(best.id);
}

export async function getMoviesForKeywords(keywords = []) {
  const out = [];
  for (const kw of keywords) {
    try {
      const m = await searchMovieByTitle(kw);
      if (m) out.push(m);
    } catch (e) {
      // skip failures per keyword
    }
  }
  return out;
}
