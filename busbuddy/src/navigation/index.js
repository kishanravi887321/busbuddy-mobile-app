/**
 * Navigation Entry Point
 * Exports all navigation related components and utilities
 */

export { default as RootNavigator } from './RootNavigator';
export { default as AuthNavigator } from './AuthNavigator';

// Navigation Screen Names - for type safety and consistency
export const AUTH_SCREENS = {
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  FORGOT_PASSWORD: 'ForgotPassword',
};

// TODO: Add more screen name constants as you create them
// export const MAIN_SCREENS = {
//   HOME: 'Home',
//   PROFILE: 'Profile',
//   ...
// };
