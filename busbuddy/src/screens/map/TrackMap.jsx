import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import VIForegroundService from '@voximplant/react-native-foreground-service';

const TrackMap = () => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchId = useRef(null);

  // Request permission for Android
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location for live tracking.',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS will handle location permission via Info.plist
  };

  // Create notification channel (required on Android 8+)
  useEffect(() => {
    const createChannel = async () => {
      try {
        await VIForegroundService.getInstance().createNotificationChannel({
          id: 'live_tracking',          // unique channel id
          name: 'Live Tracking',        // channel name
          description: 'Tracks location in real-time', // optional
          enableVibration: false,       // optional
        });
      } catch (err) {
        console.error('Failed to create notification channel:', err);
      }
    };
    createChannel();
  }, []);

  const startTracking = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot start tracking without location permission.');
      return;
    }

    // Start foreground service
    try {
      await VIForegroundService.getInstance().startService({
        channelId: 'live_tracking',
        id: 144,
        title: 'Live Tracking Active',
        text: 'Your location is being tracked',
        icon: 'ic_icon', // make sure this drawable exists in android/app/src/main/res/drawable
      });
    } catch (err) {
      console.error('Failed to start foreground service:', err);
      return;
    }

    // Start watching location
    watchId.current = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
      },
      error => console.log('Location error:', error),
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 1000,
        fastestInterval: 1000,
        maximumAge: 0,
      }
    );

    setIsTracking(true);
    console.log('Tracking started');
  };

  const stopTracking = async () => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    try {
      await VIForegroundService.getInstance().stopService();
    } catch (err) {
      console.error('Failed to stop foreground service:', err);
    }

    setIsTracking(false);
    console.log('Tracking stopped');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Location Tracker</Text>

      <View style={styles.btnContainer}>
        <Button
          title={isTracking ? "Tracking..." : "Start Live Tracking"}
          onPress={startTracking}
          disabled={isTracking}
        />
      </View>

      <View style={styles.btnContainer}>
        <Button
          title="Stop Tracking"
          onPress={stopTracking}
          color="red"
          disabled={!isTracking}
        />
      </View>

      <View style={styles.box}>
        {location ? (
          <>
            <Text style={styles.coordText}>Latitude: {location.latitude}</Text>
            <Text style={styles.coordText}>Longitude: {location.longitude}</Text>
          </>
        ) : (
          <Text style={styles.coordText}>Tracking not started</Text>
        )}
      </View>
    </View>
  );
};

export default TrackMap;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f9f9f9' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  btnContainer: { marginVertical: 10 },
  box: { marginTop: 40, padding: 20, borderRadius: 12, backgroundColor: '#fff', elevation: 3 },
  coordText: { fontSize: 18, textAlign: 'center', color: 'black' },
});
