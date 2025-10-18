/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import TrackMap from './src/screens/map/TrackMap';
import { name as appName } from './app.json';

// AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent(appName, () => TrackMap);
