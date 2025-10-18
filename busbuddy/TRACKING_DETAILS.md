# 🚌 BusBuddy GPS Tracking Configuration

## ⚙️ Current GPS Settings

### 📡 Location Update Configuration
```javascript
{
  enableHighAccuracy: true,        // Uses GPS satellites (not WiFi/cell towers)
  distanceFilter: 0,               // Time-based updates only (not distance)
  interval: 1000,                  // Update every 1 second (1000ms)
  fastestInterval: 1000,           // Minimum 1 second between updates
  maximumAge: 0,                   // Never use cached/old locations
  timeout: 20000,                  // 20 second timeout to acquire GPS lock
  useSignificantChanges: false,    // Get ALL updates (not just significant)
}
```

### 🎯 Accuracy Levels

The app provides **native Android GPS accuracy** from the LocationManager:

| Accuracy Range | Quality Rating | Color Code |
|---------------|----------------|------------|
| < 10 meters   | **Excellent** ✅ | Green (#10B981) |
| 10-20 meters  | **Good** 🟡      | Amber (#F59E0B) |
| 20-50 meters  | **Fair** 🟠      | Orange |
| > 50 meters   | **Poor** 🔴      | Red (#EF4444) |

### 📱 Background Tracking

**When you minimize the app:**
- ✅ GPS continues tracking via **Foreground Service**
- ✅ Persistent notification shows live stats
- ✅ Location updates every **1 second**
- ✅ Notification updates in real-time
- ✅ Works on all Android versions (10, 11, 12, 13, 14+)

**AppState Monitoring:**
- Logs when app goes to background
- Logs when app comes back to foreground
- Tracking continues seamlessly during app state changes

## 🔐 Required Permissions

### Android Manifest (AndroidManifest.xml)
```xml
<!-- Core Location Permissions -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>

<!-- Background Location (Android 10+) -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Foreground Service Permissions -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />

<!-- Notification Permission (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Runtime Permission Flow
1. **ACCESS_FINE_LOCATION** - Requested when starting tracking
2. **POST_NOTIFICATIONS** - Requested on Android 13+ for persistent notification
3. **ACCESS_BACKGROUND_LOCATION** - Install-time permission (user enables in settings)

## 📊 Real-Time Stats Displayed

### In-App Stats Cards (Scrollable)
1. **⏱️ Duration** - Total tracking time (HH:MM:SS)
2. **📍 Distance** - Kilometers tracked using Haversine formula
3. **🚀 Speed** - Current speed in km/h
4. **🎯 Accuracy** - GPS accuracy in meters (color-coded)

### Notification Stats
- **Duration**: Live tracking time
- **Distance**: Total distance traveled
- **Speed**: Current speed
- **Pause/Resume Button**: Control tracking without opening app

## 🔧 Technical Implementation

### GPS Provider
- **Library**: `@react-native-community/geolocation` v3.4.0
- **Native API**: Android LocationManager
- **Provider**: GPS_PROVIDER (high accuracy mode)
- **Update Method**: `watchPosition()` for continuous tracking

### Foreground Service
- **Library**: `@voximplant/react-native-foreground-service` v3.0.2
- **Service Type**: Location (`foregroundServiceType="location"`)
- **Notification Channel**: `live_tracking` (IMPORTANCE_HIGH)
- **Notification ID**: 144
- **Priority**: PRIORITY_MAX (2)
- **Flags**: `ongoing: true` (non-dismissible)

### Distance Calculation
```javascript
// Haversine Formula for accurate distance
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};
```

## 📝 Console Logs

### Location Updates (Every 1 Second)
```
📍 Location: 12.345678, 98.765432 | Accuracy: 8.5m | Speed: 15.2m/s
```

### App State Changes
```
📱 App minimized - GPS tracking continues in background via foreground service
📱 App resumed - GPS tracking active
```

### Service Status
```
✅ Notification channel created successfully
✅ Foreground service started
🔄 Tracking paused
▶️ Tracking resumed
⏹️ Tracking stopped
```

## 🌐 Android Version Compatibility

| Android Version | API Level | Status | Notes |
|----------------|-----------|--------|-------|
| Android 10 (Q) | 29 | ✅ Full Support | Background location works |
| Android 11 (R) | 30 | ✅ Full Support | All features working |
| Android 12 (S) | 31 | ✅ Full Support | Foreground service optimized |
| Android 13 (T) | 33 | ✅ Full Support | POST_NOTIFICATIONS required |
| Android 14 (U) | 34 | ✅ Full Support | Broadcast receiver compatibility added |

## 🎨 UI Features

### Status Indicator
- **Green Pulsing Dot** - Active tracking
- **Yellow Dot** - Paused
- **Gray Dot** - Stopped

### Stats Cards
- **Layout**: Horizontal ScrollView
- **Card Width**: 110px each
- **Cards**: 4 scrollable cards
- **Spacing**: 10px between cards
- **Style**: White cards with shadows

### Accuracy Display
- **Color-coded** accuracy value
- **Real-time updates** every 1 second
- **Quality indicator** (Excellent/Good/Fair/Poor)
- **Native precision** from Android LocationManager

## 🔍 How to Test Background Tracking

1. **Start Tracking**
   - Press "🚀 Start Live Tracking" button
   - Grant location permission
   - Grant notification permission (Android 13+)

2. **Minimize the App**
   - Press home button or switch to another app
   - Pull down notification shade
   - You should see "Live Location Tracking" notification

3. **Verify Continuous Updates**
   - Notification updates every 1 second
   - Distance increases as you move
   - Speed shows in real-time
   - Duration timer increments

4. **Check Console Logs** (via `npx react-native log-android`)
   - Look for "📍 Location:" logs every 1 second
   - Check accuracy values (should be < 20m outdoors)
   - Verify "App minimized" log when backgrounded

5. **Return to App**
   - Open app from notification or app drawer
   - Stats should match notification
   - No gaps in tracking data

## 📈 Expected Accuracy Performance

### Optimal Conditions (Clear Sky)
- **Accuracy**: 3-8 meters
- **GPS Lock Time**: 5-15 seconds
- **Update Reliability**: 100% (1 Hz)

### Good Conditions (Few Obstructions)
- **Accuracy**: 8-15 meters
- **GPS Lock Time**: 10-30 seconds
- **Update Reliability**: 95%+

### Fair Conditions (Urban/Trees)
- **Accuracy**: 15-30 meters
- **GPS Lock Time**: 30-60 seconds
- **Update Reliability**: 85%+

### Poor Conditions (Indoor/Heavy Cover)
- **Accuracy**: 30-100+ meters
- **GPS Lock Time**: May timeout (20s limit)
- **Update Reliability**: <70%

## 🚀 Performance Notes

- **Battery Impact**: High (GPS @ 1Hz)
- **CPU Usage**: Low (native LocationManager)
- **Memory Usage**: Minimal (~5-10MB)
- **Network Usage**: None (pure GPS, no A-GPS data)

---

**Last Updated**: October 19, 2025  
**App Version**: React Native 0.73.6  
**Target SDK**: Android 14 (API 34)
