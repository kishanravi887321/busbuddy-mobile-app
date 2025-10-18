import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform, 
  PermissionsAndroid, 
  Alert,
  Animated,
  ActivityIndicator,
  Linking 
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import VIForegroundService from '@voximplant/react-native-foreground-service';

const TrackMap = () => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const watchId = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Open app settings
  const openAppSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  // Request permissions for Android
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        // Request location permission
        const locationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'BusBuddy needs access to your location for live tracking.',
            buttonPositive: 'OK',
          },
        );

        if (locationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required for tracking.');
          return false;
        }

        // Request notification permission for Android 13+
        if (Platform.Version >= 33) {
          const notificationGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'BusBuddy needs to show a persistent notification while tracking your location.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );

          if (notificationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              '⚠️ Notification Permission Required',
              'To see the persistent notification:\n\n' +
              '1. Go to Settings → Apps → busbuddy\n' +
              '2. Enable "Notifications"\n' +
              '3. Enable "live_tracking" channel\n\n' +
              'Without this, the notification won\'t be visible.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings', 
                  onPress: openAppSettings 
                },
                { text: 'Continue Anyway', style: 'default' }
              ]
            );
          }
        }

        return true;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions via Info.plist
  };

  // Create notification channel (required on Android 8+)
  useEffect(() => {
    const createChannel = async () => {
      try {
        await VIForegroundService.getInstance().createNotificationChannel({
          id: 'live_tracking',
          name: 'Live Location Tracking',
          description: 'Shows persistent notification while tracking your location',
          enableVibration: false,
          importance: 4, // IMPORTANCE_HIGH - ensures notification is always visible
        });
        console.log('✅ Notification channel created successfully');
      } catch (err) {
        console.error('❌ Failed to create notification channel:', err);
      }
    };
    createChannel();

    // Start pulse animation for tracking indicator
    return () => {
      pulseAnim.setValue(1);
    };
  }, []);

  // Pulse animation effect
  useEffect(() => {
    if (isTracking) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isTracking]);

  const startTracking = async () => {
    setIsLoading(true);
    const hasPermissions = await requestPermissions();
    
    if (!hasPermissions) {
      setIsLoading(false);
      Alert.alert('Permission Required', 'Cannot start tracking without required permissions.');
      return;
    }

    // Start foreground service with enhanced notification
    try {
      await VIForegroundService.getInstance().startService({
        channelId: 'live_tracking',
        id: 144,
        title: '🚍 BusBuddy - Live Tracking Active',
        text: 'Your location is being tracked continuously',
        icon: 'ic_notification',
        priority: 2, // PRIORITY_MAX
      });
      console.log('✅ Foreground service started');
    } catch (err) {
      console.error('❌ Failed to start foreground service:', err);
      setIsLoading(false);
      Alert.alert('Service Error', 'Failed to start tracking service. Please try again.');
      return;
    }

    // Start watching location
    watchId.current = Geolocation.watchPosition(
      position => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        setLocation({ 
          latitude, 
          longitude, 
          accuracy: accuracy ? accuracy.toFixed(2) : 'N/A',
          speed: speed ? (speed * 3.6).toFixed(2) : '0' // Convert m/s to km/h
        });
        console.log(`📍 Location updated: ${latitude}, ${longitude}`);
      },
      error => {
        console.error('❌ Location error:', error);
        Alert.alert('Location Error', 'Failed to get location updates. Please check your GPS settings.');
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
        fastestInterval: 3000,
        maximumAge: 0,
      }
    );

    setIsTracking(true);
    setIsLoading(false);
    console.log('✅ Tracking started successfully');
    Alert.alert('Tracking Started', 'Location tracking is now active. You can minimize the app.');
  };

  const stopTracking = async () => {
    setIsLoading(true);
    
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
      console.log('📍 Location watch cleared');
    }

    try {
      await VIForegroundService.getInstance().stopService();
      console.log('✅ Foreground service stopped');
    } catch (err) {
      console.error('❌ Failed to stop foreground service:', err);
    }

    setIsTracking(false);
    setIsLoading(false);
    setLocation(null);
    console.log('⏹️ Tracking stopped');
    Alert.alert('Tracking Stopped', 'Location tracking has been stopped.');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚍 BusBuddy</Text>
        <Text style={styles.headerSubtitle}>Live Location Tracker</Text>
      </View>

      {/* Status Indicator */}
      <View style={styles.statusContainer}>
        <Animated.View 
          style={[
            styles.statusIndicator, 
            { 
              backgroundColor: isTracking ? '#10B981' : '#6B7280',
              transform: [{ scale: isTracking ? pulseAnim : 1 }]
            }
          ]} 
        />
        <Text style={styles.statusText}>
          {isTracking ? '🟢 Tracking Active' : '⚫ Tracking Inactive'}
        </Text>
      </View>

      {/* Location Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Current Location</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Initializing...</Text>
          </View>
        ) : location ? (
          <View style={styles.locationInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Latitude:</Text>
              <Text style={styles.infoValue}>{location.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Longitude:</Text>
              <Text style={styles.infoValue}>{location.longitude.toFixed(6)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Accuracy:</Text>
              <Text style={styles.infoValue}>{location.accuracy} meters</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Speed:</Text>
              <Text style={styles.infoValue}>{location.speed} km/h</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyText}>No location data yet</Text>
            <Text style={styles.emptyHint}>Start tracking to see your location</Text>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.startButton, isTracking && styles.buttonDisabled]}
          onPress={startTracking}
          disabled={isTracking || isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isTracking ? '✅ Tracking...' : '▶️ Start Live Tracking'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.stopButton, !isTracking && styles.buttonDisabled]}
          onPress={stopTracking}
          disabled={!isTracking || isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>⏹️ Stop Tracking</Text>
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      {isTracking && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>ℹ️</Text>
          <Text style={styles.infoBannerText}>
            A persistent notification keeps tracking active even when app is minimized
          </Text>
        </View>
      )}
    </View>
  );
};


export default TrackMap;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    paddingVertical: 15,
    paddingHorizontal: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationInfo: {
    gap: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoBannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
});
