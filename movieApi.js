// ===== TMDB API Integration =====

// TMDB Configuration - Using your actual API key
const TMDB_API_KEY = '1ea25c3416f7df2280ea4a39ab16a3d1';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Genre mappings
const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// Helper to get genre names
function getGenreNames(genreIds) {
  if (!genreIds || !Array.isArray(genreIds)) return [];
  return genreIds.map(id => GENRE_MAP[id] || 'Unknown').filter(Boolean);
}

// Convert TMDB movie to our app's movie format
function convertTMDBMovie(tmdbMovie) {
  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.original_title || 'Unknown',
    year: tmdbMovie.release_date ? tmdbMovie.release_date.substring(0, 4) : 'N/A',
    rating: tmdbMovie.vote_average || 0,
    votes: tmdbMovie.vote_count || 0,
    runtime: tmdbMovie.runtime ? `${tmdbMovie.runtime} min` : 'N/A',
    runtime_min: tmdbMovie.runtime || 0,
    genre: getGenreNames(tmdbMovie.genre_ids || []),
    certificate: tmdbMovie.adult ? 'A' : 'U',
    poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
    overview: tmdbMovie.overview || 'No overview available.',
    meta_score: Math.round((tmdbMovie.vote_average || 0) * 10),
    director: tmdbMovie.director || 'Unknown',
    stars: tmdbMovie.cast || [],
    gross: tmdbMovie.revenue ? `$${tmdbMovie.revenue.toLocaleString()}` : 'N/A',
    gross_num: tmdbMovie.revenue || 0,
    isTMDB: true
  };
}

// Fetch function with API key
async function fetchTMDB(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params
  });
  
  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  
  return response.json();
}

// Fetch trending movies from TMDB
async function fetchTrendingMovies(page = 1) {
  try {
    const data = await fetchTMDB('/trending/movie/week', { page });
    return {
      results: data.results.map(convertTMDBMovie),
      total_pages: data.total_pages,
      total_results: data.total_results
    };
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return null;
  }
}

// Search movies on TMDB
async function searchTMDBMovies(query, page = 1) {
  try {
    const data = await fetchTMDB('/search/movie', { 
      query: query.trim(),
      page 
    });
    return {
      results: data.results.map(convertTMDBMovie),
      total_pages: data.total_pages,
      total_results: data.total_results
    };
  } catch (error) {
    console.error('Error searching TMDB movies:', error);
    return null;
  }
}

// Get movie details from TMDB
async function getTMDBMovieDetails(id) {
  try {
    const data = await fetchTMDB(`/movie/${id}`, { 
      append_to_response: 'credits' 
    });
    
    const movie = convertTMDBMovie(data);
    
    // Add director and cast from credits
    if (data.credits) {
      const director = data.credits.crew.find(person => person.job === 'Director');
      movie.director = director ? director.name : 'Unknown';
      movie.stars = data.credits.cast.slice(0, 8).map(person => person.name);
    }
    
    return movie;
  } catch (error) {
    console.error('Error fetching TMDB movie details:', error);
    return null;
  }
}

// Get similar movies from TMDB
async function getSimilarTMDBMovies(id) {
  try {
    const data = await fetchTMDB(`/movie/${id}/similar`);
    return data.results.slice(0, 6).map(convertTMDBMovie);
  } catch (error) {
    console.error('Error fetching similar TMDB movies:', error);
    return [];
  }
}

// Check if TMDB API key is configured
function isTMDBConfigured() {
  return TMDB_API_KEY && TMDB_API_KEY.length > 0;
}

// Fetch top rated movies from TMDB
async function fetchTopRatedMovies(page = 1) {
  try {
    const data = await fetchTMDB('/movie/top_rated', { page });
    return {
      results: data.results.map(convertTMDBMovie),
      total_pages: data.total_pages,
      total_results: data.total_results
    };
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    return null;
  }
}

// Fetch newest movies from TMDB (by release date)
async function fetchNewestMovies(page = 1) {
  try {
    const data = await fetchTMDB('/discover/movie', { 
      page,
      sort_by: 'release_date.desc',
      'release_date.lte': new Date().toISOString().split('T')[0] // Today's date
    });
    return {
      results: data.results.map(convertTMDBMovie),
      total_pages: data.total_pages,
      total_results: data.total_results
    };
  } catch (error) {
    console.error('Error fetching newest movies:', error);
    return null;
  }
}