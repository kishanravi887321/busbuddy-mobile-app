import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Auth Screens
import LoginScreen from '../screens/auth/Login';
import SignupScreen from '../screens/auth/Signup';
import ForgotPasswordScreen from '../screens/auth/ForgetPassword';

const Stack = createNativeStackNavigator();

/**
 * Authentication Navigator
 * Handles all authentication related screens (Login, Signup, Forgot Password)
 */
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          title: 'Login',
        }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen}
        options={{
          title: 'Create Account',
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{
          title: 'Forgot Password',
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
