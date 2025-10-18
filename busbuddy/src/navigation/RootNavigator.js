import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Navigators
import AuthNavigator from './AuthNavigator';

// Import Auth Context
import { useAuth } from '../contexts/AuthContext';

const Stack = createNativeStackNavigator();

/**
 * Root Navigator
 * Main navigation container that handles app-level navigation
 * Switches between Auth and Main app based on authentication state
 */
const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9B7EDE" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack - when user is not logged in
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{
            animationTypeForReplace: 'pop',
          }}
        />
      ) : (
        // Main App Stack - when user is logged in
        // TODO: Create MainNavigator for authenticated users
        <Stack.Screen 
          name="Main" 
          component={AuthNavigator} // Temporary - replace with MainNavigator
        />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default RootNavigator;
