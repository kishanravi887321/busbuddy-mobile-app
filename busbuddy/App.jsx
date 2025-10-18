import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {enanbleScreens} from 'react-native-screens';

// enanbleScreens(); 

// Import Root Navigator
import { RootNavigator } from './src/navigation';

// Import Auth Provider
import { AuthProvider } from './src/contexts/AuthContext';

/**
 * Main App Component
 * Entry point of the application with Navigation and Providers
 */
const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar 
            barStyle="dark-content" 
            backgroundColor="#FFFFFF" 
          />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;