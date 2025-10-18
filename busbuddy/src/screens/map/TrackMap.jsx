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
  Linking,
  ScrollView,
  AppState 
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import VIForegroundService from '@voximplant/react-native-foreground-service';

const TrackMap = () => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const watchId = useRef(null);
  const notificationIntervalId = useRef(null);
  const lastPosition = useRef(null);
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

    // Monitor app state for background/foreground changes
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' && isTracking && !isPaused) {
        console.log('📱 App minimized - GPS tracking continues in background via foreground service');
      } else if (nextAppState === 'active' && isTracking) {
        console.log('📱 App resumed - GPS tracking active');
      }
    });

    // Start pulse animation for tracking indicator
    return () => {
      pulseAnim.setValue(1);
      appStateSubscription?.remove();
    };
  }, [isTracking, isPaused]);

  // Pulse animation effect
  useEffect(() => {
    if (isTracking && !isPaused) {
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
  }, [isTracking, isPaused]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Update notification with current state
  const updateNotification = async (paused = false) => {
    try {
      const elapsedTime = trackingStartTime 
        ? Math.floor((Date.now() - trackingStartTime) / 1000 / 60) 
        : 0;

      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      await VIForegroundService.getInstance().startService({
        channelId: 'live_tracking',
        id: 144,
        title: paused 
          ? '⏸️ BusBuddy - Tracking Paused' 
          : `🚍 BusBuddy - Live Tracking [${currentTime}]`,
        text: paused
          ? `Tracking paused | ${totalDistance.toFixed(2)} km tracked`
          : `${elapsedTime} min • ${totalDistance.toFixed(2)} km • ${location?.speed || 0} km/h`,
        icon: 'ic_notification',
        priority: 2,
        button: paused ? 'Resume' : 'Pause',
        ongoing: true, // Makes notification non-dismissible (can't swipe away)
      });
      
      console.log(`🔔 Notification updated at ${currentTime}`);
    } catch (err) {
      console.error('Failed to update notification:', err);
    }
  };

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
      setTrackingStartTime(Date.now());
      setTotalDistance(0);
      lastPosition.current = null;

      await VIForegroundService.getInstance().startService({
        channelId: 'live_tracking',
        id: 144,
        title: '🚍 BusBuddy - Live Tracking Active',
        text: 'Initializing GPS location...',
        icon: 'ic_notification',
        priority: 2,
        button: 'Pause',
        ongoing: true, // Non-dismissible notification
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
        
        // Calculate distance if we have a previous position
        if (lastPosition.current && !isPaused) {
          const distance = calculateDistance(
            lastPosition.current.latitude,
            lastPosition.current.longitude,
            latitude,
            longitude
          );
          setTotalDistance(prev => prev + distance);
        }
        
        lastPosition.current = { latitude, longitude };
        
        setLocation({ 
          latitude, 
          longitude, 
          accuracy: accuracy || null, // Store raw number or null
          speed: speed ? (speed * 3.6).toFixed(2) : '0'
        });
        
        // Update notification with live data
        if (!isPaused) {
          updateNotification(false);
        }
        
        console.log(`📍 Location: ${latitude}, ${longitude} | Accuracy: ${accuracy || 'N/A'}m | Speed: ${speed || 0}m/s`);
      },
      error => {
        console.error('❌ Location error:', error);
        Alert.alert('Location Error', 'Failed to get location updates. Please check your GPS settings.');
      },
      {
        enableHighAccuracy: true, // Use GPS for maximum accuracy
        distanceFilter: 0, // Get updates regardless of distance (time-based only)
        interval: 1000, // Update every 1 second for real-time tracking
        fastestInterval: 1000, // Minimum interval 1 second
        maximumAge: 0, // Don't use cached locations
        timeout: 5000, // 5 second timeout for location acquisition
        useSignificantChanges: false, // Don't use significant changes (get all updates)
      }
    );

    // Force notification updates every 1 second (keeps it visible and up-to-date)
    notificationIntervalId.current = setInterval(() => {
      if (!isPaused) {
        updateNotification(false);
      }
    }, 1000); // Update notification every 1 second

    setIsTracking(true);
    setIsPaused(false);
    setIsLoading(false);
    console.log('✅ Tracking started successfully');
    Alert.alert('Tracking Started', 'Location tracking is now active. You can minimize the app.');
  };

  const pauseTracking = () => {
    setIsPaused(true);
    updateNotification(true);
    console.log('⏸️ Tracking paused');
  };

  const resumeTracking = () => {
    setIsPaused(false);
    updateNotification(false);
    console.log('▶️ Tracking resumed');
  };

  const stopTracking = async () => {
    setIsLoading(true);
    
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
      console.log('📍 Location watch cleared');
    }

    // Clear notification update interval
    if (notificationIntervalId.current !== null) {
      clearInterval(notificationIntervalId.current);
      notificationIntervalId.current = null;
      console.log('🔔 Notification interval cleared');
    }

    try {
      await VIForegroundService.getInstance().stopService();
      console.log('✅ Foreground service stopped');
    } catch (err) {
      console.error('❌ Failed to stop foreground service:', err);
    }

    setIsTracking(false);
    setIsPaused(false);
    setIsLoading(false);
    setTrackingStartTime(null);
    setLocation(null);
    lastPosition.current = null;
    console.log('⏹️ Tracking stopped');
    
    const finalDistance = totalDistance.toFixed(2);
    Alert.alert(
      'Tracking Stopped', 
      `Total distance tracked: ${finalDistance} km`
    );
  };

  // Format elapsed time
  const getElapsedTime = () => {
    if (!trackingStartTime) return '0:00';
    const elapsed = Math.floor((Date.now() - trackingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
              backgroundColor: isTracking ? (isPaused ? '#F59E0B' : '#10B981') : '#6B7280',
              transform: [{ scale: isTracking && !isPaused ? pulseAnim : 1 }]
            }
          ]} 
        />
        <Text style={styles.statusText}>
          {isTracking ? (isPaused ? '� Tracking Paused' : '�🟢 Tracking Active') : '⚫ Tracking Inactive'}
        </Text>
      </View>

      {/* Tracking Stats - Show when tracking */}
      {isTracking && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsScrollContainer}
          contentContainerStyle={styles.statsContainer}
        >
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>{getElapsedTime()}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📏</Text>
            <Text style={styles.statValue}>{totalDistance.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🚀</Text>
            <Text style={styles.statValue}>{location?.speed || '0'}</Text>
            <Text style={styles.statLabel}>km/h</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>
              {location?.accuracy !== undefined && location?.accuracy !== null 
                ? `${location.accuracy.toFixed(1)}m` 
                : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </ScrollView>
      )}

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
              <Text style={[
                styles.infoValue,
                { 
                  color: location.accuracy && location.accuracy < 10 ? '#10B981' : 
                         location.accuracy && location.accuracy < 20 ? '#F59E0B' : '#EF4444',
                  fontWeight: 'bold'
                }
              ]}>
                {location.accuracy !== undefined && location.accuracy !== null 
                  ? `${location.accuracy.toFixed(1)}m ${
                      location.accuracy < 10 ? '(Excellent)' :
                      location.accuracy < 20 ? '(Good)' :
                      location.accuracy < 50 ? '(Fair)' : '(Poor)'
                    }`
                  : 'N/A'
                }
              </Text>
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
        {!isTracking ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={startTracking}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '⏳ Starting...' : '▶️ Start Live Tracking'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, isPaused ? styles.resumeButton : styles.pauseButton]}
              onPress={isPaused ? resumeTracking : pauseTracking}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isPaused ? '▶️ Resume Tracking' : '⏸️ Pause Tracking'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopTracking}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>⏹️ Stop Tracking</Text>
            </TouchableOpacity>
          </>
        )}
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

      {/* Settings Helper */}
      {!isTracking && (
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => {
            Alert.alert(
              '📱 Enable Notifications',
              'If you don\'t see the notification when tracking:\n\n' +
              '1. Go to Phone Settings\n' +
              '2. Find Apps → busbuddy\n' +
              '3. Enable Notifications\n' +
              '4. Enable "live_tracking" channel\n\n' +
              'Tap "Open Settings" to go there now.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: openAppSettings }
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsButtonText}>
            ⚙️ Need help with notifications?
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};


export default TrackMap;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsContainer: {
    marginBottom: 15,
    height: 100,
  },
  statCard: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 25,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 15,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
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
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  resumeButton: {
    backgroundColor: '#3B82F6',
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
  settingsButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  settingsButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});
