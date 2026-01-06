import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Linking,
  ActivityIndicator
} from 'react-native';
import { storage } from '../utils/storage';
import { commonStyles, colors } from '../styles/commonStyles';

const API_KEY = 'd5a82b51';

export default function HomeScreen({ navigation }) {
  const [movieName, setMovieName] = useState('');
  const [movies, setMovies] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('popular');
  const [categoryMovies, setCategoryMovies] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showCategoryFirst, setShowCategoryFirst] = useState(true);

  const categories = [
    { id: 'popular', label: 'Popular', keywords: ['Avengers', 'Inception', 'Interstellar', 'Titanic', 'Avatar'] },
    { id: 'romance', label: 'Romance', keywords: ['Notebook', 'Pride', 'Titanic', 'La La Land', 'Before Sunrise'] },
    { id: 'classic', label: 'Classic', keywords: ['Casablanca', 'Godfather', 'Citizen Kane', 'Psycho', 'Vertigo'] },
    { id: 'comedy', label: 'Comedy', keywords: ['Hangover', 'Superbad', 'Bridesmaids', 'Dumb', 'Anchorman'] },
    { id: 'youngadult', label: 'Young Adult', keywords: ['Hunger Games', 'Twilight', 'Divergent', 'Maze Runner', 'Fault'] }
  ];

  useEffect(() => {
    loadUser();
    loadCategoryMovies(selectedCategory);
  }, []);

  useEffect(() => {
    loadCategoryMovies(selectedCategory);
  }, [selectedCategory]);

  const loadUser = async () => {
    const user = await storage.getLoggedInUser();
    setCurrentUser(user);
  };

  const loadCategoryMovies = async (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    try {
      const moviePromises = category.keywords.map(keyword =>
        fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&t=${keyword}`)
          .then(res => res.json())
          .then(data => data.Response !== 'False' ? data : null)
      );

      const results = await Promise.all(moviePromises);
      const validMovies = results.filter(m => m !== null);
      setCategoryMovies(validMovies);
    } catch (error) {
      console.error('Failed to load category movies:', error);
    }
  };

  const searchMovie = async () => {
    if (!movieName.trim()) {
      Alert.alert('Error', 'Please enter a movie name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&t=${movieName}`
      );
      const movie = await response.json();

      if (movie.Response === 'False') {
        Alert.alert('Not Found', 'Movie not found!');
      } else {
        setMovies([movie, ...movies]);
        setMovieName('');
        setShowCategoryFirst(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch movie data');
    } finally {
      setLoading(false);
    }
  };

  const generateStars = (imdbRating) => {
    const rating = Math.round(imdbRating / 2);
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += i <= rating ? '★' : '☆';
    }
    return stars;
  };

  const watchTrailer = (title) => {
    const query = `${title} official trailer`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  const addFavourite = async (title) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    const favs = currentUser.favourites || [];
    if (favs.includes(title)) {
      Alert.alert('Info', 'Already in favourites!');
      return;
    }

    const updatedUser = {
      ...currentUser,
      favourites: [...favs, title]
    };

    await storage.updateLoggedInUser(updatedUser);
    setCurrentUser(updatedUser);
    Alert.alert('Success', 'Added to favourites ❤️');
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await storage.removeLoggedInUser();
          navigation.replace('Login');
        }
      }
    ]);
  };

  const goToProfile = () => {
    navigation.navigate('Profile');
  };

  const renderMovieCard = (movie, index, keyPrefix = '') => (
    <View key={`${keyPrefix}${index}`} style={commonStyles.movieCard}>
      {movie.Poster && movie.Poster !== 'N/A' && (
        <Image
          source={{ uri: movie.Poster }}
          style={commonStyles.moviePoster}
          resizeMode="cover"
        />
      )}
      
      <Text style={commonStyles.movieTitle}>{movie.Title}</Text>
      <Text style={commonStyles.movieRating}>IMDb: {movie.imdbRating}</Text>
      <Text style={commonStyles.movieStars}>
        {generateStars(movie.imdbRating)}
      </Text>
      <Text style={commonStyles.movieGenres}>{movie.Genre}</Text>
      <Text style={commonStyles.moviePlot}>{movie.Plot}</Text>
      <Text style={commonStyles.movieDirector}>Director: {movie.Director}</Text>

      <TouchableOpacity
        style={commonStyles.actionButton}
        onPress={() => watchTrailer(movie.Title)}
      >
        <Text style={commonStyles.actionButtonText}>▶ Watch Trailer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={commonStyles.favoriteButton}
        onPress={() => addFavourite(movie.Title)}
      >
        <Text style={commonStyles.actionButtonText}>❤️ Favourite</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              style={{ backgroundColor: colors.primary, padding: 10, borderRadius: 8 }}
              onPress={() => setSidebarVisible(!sidebarVisible)}
            >
              <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 18 }}>☰</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ backgroundColor: colors.secondary, padding: 10, borderRadius: 8 }}
              onPress={goToProfile}
            >
              <Text style={{ color: colors.white, fontWeight: 'bold' }}>Profile</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={{ backgroundColor: colors.error, padding: 10, borderRadius: 8 }}
            onPress={handleLogout}
          >
            <Text style={{ color: colors.white, fontWeight: 'bold' }}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={commonStyles.headerTitle}>Movie Search</Text>

        <View style={commonStyles.searchBox}>
          <TextInput
            style={commonStyles.searchInput}
            placeholder="Enter movie name"
            value={movieName}
            onChangeText={setMovieName}
          />
          <TouchableOpacity 
            style={commonStyles.searchButton}
            onPress={searchMovie}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={{ color: colors.white, fontWeight: 'bold' }}>Search</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Left Sidebar for Categories */}
        {sidebarVisible && (
          <ScrollView 
            style={{ 
              width: 140, 
              backgroundColor: colors.white, 
              borderRightWidth: 1, 
              borderRightColor: colors.border 
            }}
            contentContainerStyle={{ padding: 10 }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: 'bold', 
              color: colors.text,
              marginBottom: 12,
              textAlign: 'center'
            }}>
              Categories
            </Text>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  marginBottom: 8,
                  borderRadius: 8,
                  backgroundColor: selectedCategory === cat.id ? colors.primary : colors.background,
                  borderWidth: 1,
                  borderColor: selectedCategory === cat.id ? colors.primary : colors.border
                }}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  setShowCategoryFirst(true);
                  setSidebarVisible(false);
                }}
              >
                <Text style={{ 
                  color: selectedCategory === cat.id ? colors.white : colors.text,
                  fontWeight: '600',
                  textAlign: 'center',
                  fontSize: 13
                }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Main Content Area */}
        <ScrollView style={{ flex: 1 }}>
          {showCategoryFirst ? (
            <>
              {/* Recommended Movies by Category - Display First */}
              {categoryMovies.length > 0 && (
                <View style={{ padding: 12 }}>
                  <Text style={{ 
                    fontSize: 20, 
                    fontWeight: 'bold', 
                    color: colors.text,
                    marginBottom: 12
                  }}>
                    Recommended {categories.find(c => c.id === selectedCategory)?.label} Movies
                  </Text>
                  {categoryMovies.map((movie, index) => renderMovieCard(movie, index, 'cat-'))}
                </View>
              )}

              {/* Your Search Results */}
              {movies.length > 0 && (
                <View style={{ padding: 12 }}>
                  <Text style={{ 
                    fontSize: 20, 
                    fontWeight: 'bold', 
                    color: colors.text,
                    marginBottom: 12
                  }}>
                    Your Search Results
                  </Text>
                  {movies.map((movie, index) => renderMovieCard(movie, index, 'search-'))}
                </View>
              )}
            </>
          ) : (
            <>
              {/* Your Search Results - Display First */}
              {movies.length > 0 && (
                <View style={{ padding: 12 }}>
                  <Text style={{ 
                    fontSize: 20, 
                    fontWeight: 'bold', 
                    color: colors.text,
                    marginBottom: 12
                  }}>
                    Your Search Results
                  </Text>
                  {movies.map((movie, index) => renderMovieCard(movie, index, 'search-'))}
                </View>
              )}

              {/* Recommended Movies by Category */}
              {categoryMovies.length > 0 && (
                <View style={{ padding: 12 }}>
                  <Text style={{ 
                    fontSize: 20, 
                    fontWeight: 'bold', 
                    color: colors.text,
                    marginBottom: 12
                  }}>
                    Recommended {categories.find(c => c.id === selectedCategory)?.label} Movies
                  </Text>
                  {categoryMovies.map((movie, index) => renderMovieCard(movie, index, 'cat-'))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
