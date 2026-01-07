import * as Location from 'expo-location';
import { Platform, Linking } from 'react-native';

const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter'
];

// Optional Google Places API (for showtimes search)
const GOOGLE_PLACES_KEY = typeof process !== 'undefined' 
  ? (process.env?.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || null)
  : null;

const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

/**
 * Request location permissions and get current location
 */
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

/**
 * Calculate distance between two coordinates in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance.toFixed(1); // Return distance in km with 1 decimal
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Find nearby theaters/cinemas using OpenStreetMap Overpass API (Free, no key required)
 */
export const findNearbyTheaters = async (latitude, longitude, radiusInMeters = 12000) => {
  try {
    // Overpass QL query for cinemas
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="cinema"](around:${radiusInMeters},${latitude},${longitude});
        way["amenity"="cinema"](around:${radiusInMeters},${latitude},${longitude});
      );
      out body;
      >;
      out skel qt;
    `;

    let data = null;
    let lastErr = null;
    for (const baseUrl of OVERPASS_ENDPOINTS) {
      try {
        const response = await fetchWithTimeout(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          body: `data=${encodeURIComponent(query)}`
        }, 12000);

        if (!response.ok) {
          lastErr = new Error(`Overpass error: ${response.status}`);
          continue;
        }
        data = await response.json();
        break;
      } catch (e) {
        lastErr = e;
        // Try next endpoint
      }
    }

    if (!data) throw lastErr || new Error('Overpass request failed');
    
    if (!data.elements || data.elements.length === 0) {
      throw new Error('No theaters found nearby');
    }

    // Process results
    const theaters = data.elements
      .filter(element => element.tags && element.tags.name) // Only elements with names
      .map(element => {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;
        
        return {
          id: element.id.toString(),
          name: element.tags.name,
          address: element.tags['addr:street'] 
            ? `${element.tags['addr:street']}, ${element.tags['addr:city'] || ''}`
            : element.tags['addr:city'] || 'Address not available',
          latitude: lat,
          longitude: lon,
          rating: 'N/A',
          isOpen: undefined,
          distance: calculateDistance(latitude, longitude, lat, lon),
        };
      })
      .filter(theater => theater.latitude && theater.longitude); // Only valid coordinates

    if (theaters.length === 0) {
      throw new Error('No theaters found nearby');
    }

    // Sort by distance
    theaters.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    return theaters;
  } catch (error) {
    console.error('Error finding theaters:', error);
    if (/aborted/i.test(String(error?.message))) {
      throw new Error('Theater search timed out. Please try again.');
    }
    throw new Error('Unable to find theaters right now. Please try again later.');
  }
};

/**
 * Find theaters likely showing a specific movie using Google Places Text Search.
 * Note: Google Places does not expose showtimes via API. This performs a text search
 * for `${movieTitle} showtimes` constrained to the nearby `movie_theater` type and
 * ranks results by proximity and relevance.
 */
export const findTheatersShowingMovie = async (movieTitle, latitude, longitude, radiusInMeters = 20000) => {
  if (!GOOGLE_PLACES_KEY) {
    throw new Error('Google Places API key missing. Set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY');
  }

  // 1) Prefer Nearby Search with keyword and opennow to approximate "currently showing"
  const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusInMeters}&type=movie_theater&keyword=${encodeURIComponent(movieTitle)}&opennow=true&key=${GOOGLE_PLACES_KEY}`;

  try {
    let res = await fetch(nearbyUrl);
    if (!res.ok) throw new Error(`Google Places error: ${res.status}`);
    let data = await res.json();

    let results = Array.isArray(data.results) ? data.results : [];

    // 2) Fallback: Text Search for "<movie> showtimes" if Nearby finds nothing
    if (!results.length) {
      const query = encodeURIComponent(`${movieTitle} showtimes`);
      const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${latitude},${longitude}&radius=${radiusInMeters}&type=movie_theater&key=${GOOGLE_PLACES_KEY}`;
      res = await fetch(textUrl);
      if (!res.ok) throw new Error(`Google Places error: ${res.status}`);
      data = await res.json();
      results = Array.isArray(data.results) ? data.results : [];
    }

    if (!results.length) {
      throw new Error('No theaters found for this movie nearby');
    }

    const theaters = results
      .filter(r => r.geometry?.location && r.name)
      .map((r, i) => {
        const lat = r.geometry.location.lat;
        const lon = r.geometry.location.lng;
        return {
          id: r.place_id || String(i),
          name: r.name,
          address: r.formatted_address || r.vicinity || 'Address not available',
          latitude: lat,
          longitude: lon,
          rating: typeof r.rating === 'number' ? r.rating.toFixed(1) : 'N/A',
          isOpen: r.opening_hours?.open_now,
          distance: calculateDistance(latitude, longitude, lat, lon),
          placeId: r.place_id,
          mapsUrl: r.place_id ? `https://www.google.com/maps/search/?api=1&query_place_id=${r.place_id}` : undefined,
        };
      });

    theaters.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    return theaters;
  } catch (error) {
    console.error('Error finding theaters via Google:', error);
    throw new Error('Unable to find showtimes theaters right now. Please try again later.');
  }
};

/**
 * Open a web search for showtimes for a movie at a given theater.
 */
export const openShowtimesSearch = (movieTitle, theaterName) => {
  const q = encodeURIComponent(`${movieTitle} showtimes ${theaterName}`);
  const url = `https://www.google.com/search?q=${q}`;
  Linking.openURL(url);
};

/**
 * Open location in maps app
 */
export const openInMaps = (latitude, longitude, label = 'Theater') => {
  const url = Platform.select({
    ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
    android: `geo:0,0?q=${latitude},${longitude}(${label})`,
  });
  
  Linking.openURL(url);
};
