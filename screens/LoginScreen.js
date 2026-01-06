import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ImageBackground
} from 'react-native';
import { storage } from '../utils/storage';
import { commonStyles } from '../styles/commonStyles';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const backgroundImage = require('./desktop.jpg'); // local image in screens/

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const users = await storage.getUsers();

      const user = users.find(
        u => u.username === username && u.password === password
      );

      if (user) {
        await storage.setLoggedInUser(user);
        navigation.replace('Home');
      } else {
        Alert.alert('Error', 'Invalid login credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to login. Please try again.');
    }
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          style={[commonStyles.container, styles.transparentBg]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={commonStyles.centered}>
            <View style={[commonStyles.card, styles.glassCard]}>
              <Text style={commonStyles.title}>🎬 Movie Search</Text>
              <Text style={commonStyles.subtitle}>Welcome back</Text>

              <TextInput
                style={commonStyles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity 
                style={commonStyles.button}
                onPress={handleLogin}
              >
                <Text style={commonStyles.buttonText}>Login</Text>
              </TouchableOpacity>

              <Text style={commonStyles.linkText}>
                New here?{' '}
                <Text 
                  style={commonStyles.link}
                  onPress={() => navigation.navigate('Register')}
                >
                  Create account
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  transparentBg: {
    backgroundColor: 'transparent'
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8
  }
});
