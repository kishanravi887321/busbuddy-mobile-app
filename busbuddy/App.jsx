// import React from 'react';
// import { StatusBar, Text } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import {enanbleScreens} from 'react-native-screens';

// // enanbleScreens(); 

// // Import Root Navigator
// import { RootNavigator } from './src/navigation';

// // Import Auth Provider
// import { AuthProvider } from './src/contexts/AuthContext';

// /**
//  * Main App Component
//  * Entry point of the application with Navigation and Providers
//  */
// console.log("App.jsx loaded");
// const App = () => {
//   return (
//     <SafeAreaProvider>
//       <Text>Test</Text>
//       <AuthProvider>
//         <NavigationContainer>
//           <StatusBar 
//             barStyle="dark-content" 
//             backgroundColor="#FFFFFF" 
//           />
//           <RootNavigator />
//         </NavigationContainer>
//       </AuthProvider>
//     </SafeAreaProvider>
//   );
// };

// export default App;



import React from 'react';
import { 
  StatusBar, 
  Text, 
  View, 
  StyleSheet 
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { enableScreens } from 'react-native-screens';

// enableScreens(); 

// Import Root Navigator
// import { RootNavigator } from './src/navigation';

// Import Auth Provider
// import { AuthProvider } from './src/contexts/AuthContext';

/**
 * Main App Component
 * Entry point of the application with Navigation and Providers
 */
console.log("App.jsx loaded");

// const App = () => {
//   return (
//     <SafeAreaProvider>
//       <Text>Test</Text>
//       <AuthProvider>
//         <NavigationContainer>
//           <StatusBar 
//             barStyle="dark-content" 
//             backgroundColor="#FFFFFF" 
//           />
//           <RootNavigator />
//         </NavigationContainer>
//       </AuthProvider>
//     </SafeAreaProvider>
//   );
// };

const App = () => {
  return (
    <View style={styles.container}>
      <Text>App</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
