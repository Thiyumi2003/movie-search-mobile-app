import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { storage } from '../utils/storage';
import { commonStyles, colors } from '../styles/commonStyles';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const backgroundImage = require('./pngtree.jpg');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const loggedInUser = await storage.getLoggedInUser();
    if (!loggedInUser) {
      navigation.replace('Login');
      return;
    }
    setUser(loggedInUser);
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

  const goBack = () => {
    navigation.goBack();
  };

  const removeFavourite = async (title) => {
    const updatedUser = {
      ...user,
      favourites: (user.favourites || []).filter(item => item !== title)
    };
    await storage.updateLoggedInUser(updatedUser);
    setUser(updatedUser);
  };

  const openFavourite = (title) => {
    navigation.navigate('Home', { searchTitle: title });
  };

  if (!user) {
    return (
      <View style={commonStyles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.profileContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.10)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.profileCard, styles.glassCard]}
          >
            <Text style={styles.profileTitle}>User Profile</Text>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Username:</Text>
              <Text style={styles.infoValue}>{user.username}</Text>
            </View>

            <View style={styles.favSection}>
              <Text style={styles.favTitle}>❤️ Favourite Movies</Text>
              {user.favourites && user.favourites.length > 0 ? (
                user.favourites.map((movie, index) => (
                  <View key={index} style={styles.favItem}>
                    <Text style={styles.favBullet}>• </Text>
                    <Text style={styles.favText}>{movie}</Text>
                    <View style={styles.favActions}>
                      <TouchableOpacity
                        style={[styles.favButton, styles.searchBtn]}
                        onPress={() => openFavourite(movie)}
                      >
                        <Text style={styles.favButtonText}>Search</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.favButton, styles.removeBtn]}
                        onPress={() => removeFavourite(movie)}
                      >
                        <Text style={styles.favButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noFavText}>No favourite movies yet</Text>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[commonStyles.button, styles.backButton]}
                onPress={goBack}
              >
                <Text style={commonStyles.buttonText}>Back to Movies</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[commonStyles.button, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Text style={commonStyles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
      </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  profileContainer: {
    padding: 20,
    paddingTop: 50,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  glassCard: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '500',
  },
  favSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  favTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  favItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center'
  },
  favBullet: {
    fontSize: 16,
    color: colors.favorite,
  },
  favText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  favActions: {
    flexDirection: 'row',
    gap: 6
  },
  favButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8
  },
  favButtonText: {
    color: colors.white,
    fontWeight: '600'
  },
  searchBtn: {
    backgroundColor: colors.secondary
  },
  removeBtn: {
    backgroundColor: colors.error
  },
  noFavText: {
    fontSize: 16,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
  },
  backButton: {
    backgroundColor: colors.primary,
  },
  logoutButton: {
    backgroundColor: colors.error,
  },
});
