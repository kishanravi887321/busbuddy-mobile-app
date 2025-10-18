/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import LoginScreen from './src/screens/auth/Login';
import SignupScreen from './src/screens/auth/Signup';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => LoginScreen);
