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

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const backgroundImage = require('./desktop.jpg');

  const handleRegister = async () => {
    if (!name || !username || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const users = await storage.getUsers();
      const exists = users.find(u => u.username === username);

      if (exists) {
        Alert.alert('Error', 'Username already exists');
        return;
      }

      const newUser = {
        name,
        username,
        password,
        favourites: []
      };

      users.push(newUser);
      await storage.setUsers(users);
      
      Alert.alert('Success', 'Registration successful!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login')
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to register. Please try again.');
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
              <Text style={commonStyles.title}>Create Account</Text>

              <TextInput
                style={commonStyles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
              />

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
                onPress={handleRegister}
              >
                <Text style={commonStyles.buttonText}>Register</Text>
              </TouchableOpacity>

              <Text style={commonStyles.linkText}>
                Already have an account?{' '}
                <Text 
                  style={commonStyles.link}
                  onPress={() => navigation.navigate('Login')}
                >
                  Login
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
  background: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  transparentBg: { backgroundColor: 'transparent' },
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
