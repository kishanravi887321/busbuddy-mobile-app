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
import io from 'socket.io-client';
import notificationService from '../services/notificationService';

// Socket.IO Configuration (Testing)
const SOCKET_URL = 'https://where-is-mybus.onrender.com';
const TEST_BUS_ID = 'BUS111';
const TEST_TOKEN = '1234';

const TrackMap = () => {
  const [location, setLocation] = useState(null);
  
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const watchId = useRef(null);
  const isTrackingRef = useRef(false); // Ref to track state in callbacks
  const isPausedRef = useRef(false);   // Ref to track pause state in callbacks
  const notificationCheckInterval = useRef(null); // Check if notification is dismissed
  const socketRef = useRef(null);
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

  // Initialize Socket.IO connection
  useEffect(() => {
    console.log('🔌 Initializing Socket.IO connection...');
    
    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('✅ Socket.IO connected:', socketRef.current.id);
      setSocketConnected(true);
      setSocketError(null);
      
      // Identify as driver
      console.log('👤 Identifying as driver...');
      socketRef.current.emit('identify', {
        type: 'driver',
        token: TEST_TOKEN,
        busId: TEST_BUS_ID
      });
    });

    socketRef.current.on('identify:success', (data) => {
      console.log('✅ Identified successfully:', data);
      
      // Join bus room
      console.log('🚌 Joining bus room...');
      socketRef.current.emit('driver:join', {
        busId: TEST_BUS_ID,
        driverInfo: {
          name: 'Test Driver',
          phone: '+91-1234567890'
        }
      });
    });

    socketRef.current.on('identify:error', (error) => {
      console.error('❌ Identify error:', error);
      setSocketError(`Identify failed: ${error.message || error}`);
    });

    socketRef.current.on('driver:joined', (data) => {
      console.log('✅ Driver joined bus successfully:', data);
    });

    socketRef.current.on('driver:error', (error) => {
      console.error('❌ Driver error:', error);
      setSocketError(`Driver error: ${error.message || error}`);
    });

    socketRef.current.on('driver:location:sent', (data) => {
      console.log('✅ Location sent to server:', data);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setSocketConnected(false);
    });

    socketRef.current.on('error', (error) => {
      console.error('❌ Socket error:', error);
      setSocketError(`Socket error: ${error.message || error}`);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      setSocketError(`Connection error: ${error.message}`);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket...');
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Initialize notification service
  useEffect(() => {
    notificationService.initializeChannel();

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

  // Send location to Socket.IO server
  const sendLocationToServer = (locationData) => {
    if (!socketRef.current || !socketConnected) {
      console.warn('⚠️ Socket not connected, skipping location send');
      return;
    }

    try {
      const payload = {
        busId: TEST_BUS_ID,
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude
        },
        speed: parseFloat(locationData.speed) || 0,
        heading: 0, // You can add compass heading if needed
        timestamp: new Date().toISOString()
      };

      socketRef.current.emit('driver:location', payload);
      console.log('📡 Location emitted to server:', payload);
    } catch (error) {
      console.error('❌ Failed to send location:', error);
      setSocketError(`Send location error: ${error.message}`);
    }
  };

  // Update notification with current state
  const updateNotification = async (paused = false) => {
    const elapsedTime = trackingStartTime 
      ? Math.floor((Date.now() - trackingStartTime) / 1000 / 60) 
      : 0;

    await notificationService.updateNotification({
      paused,
      elapsedMinutes: elapsedTime,
      distance: totalDistance,
      speed: location?.speed || 0,
    });
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
        
        const locationData = { 
          latitude, 
          longitude, 
          accuracy: accuracy || null, // Store raw number or null
          speed: speed ? (speed * 3.6).toFixed(2) : '0'
        };
        
        setLocation(locationData);
        
        // Send location to Socket.IO server every second (only when tracking and not paused)
        if (isTrackingRef.current && !isPausedRef.current) {
          sendLocationToServer(locationData);
        }
        
        // Notification updates handled separately (not here to avoid spam)
        
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

    // No periodic notification updates - notification stays static after creation
    // But check every 15 seconds if notification was dismissed and recreate it
    notificationCheckInterval.current = setInterval(() => {
      if (isTrackingRef.current) {
        // Recreate notification if it was swiped away (ring once on reappear)
        updateNotification(isPausedRef.current);
      }
    }, 15000); // Check every 15 seconds

    setIsTracking(true);
    isTrackingRef.current = true; // Update ref for GPS callback
    setIsPaused(false);
    isPausedRef.current = false;  // Update ref for GPS callback
    setIsLoading(false);
    console.log('✅ Tracking started successfully');
    Alert.alert('Tracking Started', 'Location tracking is now active. You can minimize the app.');
  };

  const pauseTracking = () => {
    setIsPaused(true);
    isPausedRef.current = true; // Update ref
    updateNotification(true);
    console.log('⏸️ Tracking paused');
  };

  const resumeTracking = () => {
    setIsPaused(false);
    isPausedRef.current = false; // Update ref
    updateNotification(false);
    console.log('▶️ Tracking resumed');
  };

  const stopTracking = async () => {
    setIsLoading(true);
    
    // Update refs immediately to stop socket sending
    isTrackingRef.current = false;
    isPausedRef.current = false;
    
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
      console.log('📍 Location watch cleared');
    }

    // Clear notification check interval
    if (notificationCheckInterval.current !== null) {
      clearInterval(notificationCheckInterval.current);
      notificationCheckInterval.current = null;
      console.log('🔔 Notification check interval cleared');
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

      {/* Socket Status Indicator */}
      <View style={styles.socketStatus}>
        <View style={[styles.socketDot, { backgroundColor: socketConnected ? '#10B981' : '#EF4444' }]} />
        <Text style={styles.socketText}>
          {socketConnected ? '🔌 Server Connected' : '🔌 Server Disconnected'}
        </Text>
      </View>

      {/* Socket Error Display */}
      {socketError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {socketError}</Text>
        </View>
      )}

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
          {isTracking ? (isPaused ? '🟡 Tracking Paused' : '� Tracking Active') : '⚫ Tracking Inactive'}
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
  socketStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  socketDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  socketText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
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
