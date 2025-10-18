import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Platform } from 'react-native';
import BackgroundGeolocation from "react-native-background-geolocation";

const TrackMap = () => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Configure the plugin
    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 0,
      stopOnTerminate: false,   // keep tracking after app closed
      startOnBoot: true,        // restart tracking after reboot
      interval: 1000,
      fastestInterval: 1000,
      notificationsEnabled: true,
      foregroundService: true,
      notification: {
        title: "Live Tracking Active",
        text: "Your location is being tracked",
        color: "#0000FF",
      },
    }, state => {
      console.log("BackgroundGeolocation ready:", state.enabled);
    });

    // Listen to location updates
    BackgroundGeolocation.onLocation(
      location => {
        const { latitude, longitude } = location.coords;
        setLocation({ latitude, longitude });
      },
      error => {
        console.log("Location error:", error);
      }
    );

    // Cleanup on unmount
    return () => {
      BackgroundGeolocation.removeAllListeners();
    };
  }, []);

  const startTracking = () => {
    BackgroundGeolocation.start();
    setIsTracking(true);
    console.log("Tracking started");
  };

  const stopTracking = () => {
    BackgroundGeolocation.stop();
    setIsTracking(false);
    console.log("Tracking stopped");
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
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  btnContainer: {
    marginVertical: 10,
  },
  box: {
    marginTop: 40,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 3,
  },
  coordText: {
    fontSize: 18,
    textAlign: 'center',
    color:"black"
  },
});
