import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  // Get logged in user
  async getLoggedInUser() {
    try {
      const userData = await AsyncStorage.getItem('loggedInUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting logged in user:', error);
      return null;
    }
  },

  // Set logged in user
  async setLoggedInUser(user) {
    try {
      await AsyncStorage.setItem('loggedInUser', JSON.stringify(user));
    } catch (error) {
      console.error('Error setting logged in user:', error);
    }
  },

  // Remove logged in user
  async removeLoggedInUser() {
    try {
      await AsyncStorage.removeItem('loggedInUser');
    } catch (error) {
      console.error('Error removing logged in user:', error);
    }
  },

  // Get all users
  async getUsers() {
    try {
      const usersData = await AsyncStorage.getItem('users');
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  // Set all users
  async setUsers(users) {
    try {
      await AsyncStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
      console.error('Error setting users:', error);
    }
  },

  // Update logged in user and persist to users list
  async updateLoggedInUser(updatedUser) {
    try {
      await this.setLoggedInUser(updatedUser);
      const users = await this.getUsers();
      const updatedUsers = users.map(u => 
        u.username === updatedUser.username ? updatedUser : u
      );
      await this.setUsers(updatedUsers);
    } catch (error) {
      console.error('Error updating logged in user:', error);
    }
  }
};
