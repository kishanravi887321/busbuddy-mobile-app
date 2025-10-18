import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Button, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import ForegroundService from '@supersami/rn-foreground-service';

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
    return true;
  };

  const startTracking = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    // Start foreground service with notification
    ForegroundService.start({
      id: 144,
      title: 'Live Tracking Active',
      message: 'Your location is being tracked',
      importance: 'high'
    });

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
        maximumAge: 0
      }
    );

    setIsTracking(true);
    console.log('Tracking started');
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    ForegroundService.stop();
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
  coordText: { fontSize: 18, textAlign: 'center', color: 'black' }
});
