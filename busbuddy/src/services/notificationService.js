import VIForegroundService from '@voximplant/react-native-foreground-service';

class NotificationService {
  constructor() {
    this.notificationId = 144;
    this.channelId = 'live_tracking';
    this.isInitialized = false;
    this.checkInterval = null;
    this.lastUpdateTime = null;
  }

  // Initialize notification channel
  async initializeChannel() {
    if (this.isInitialized) return;
    
    try {
      await VIForegroundService.getInstance().createNotificationChannel({
        id: this.channelId,
        name: 'Live Location Tracking',
        description: 'Shows persistent notification while tracking your location',
        enableVibration: false,
        importance: 4, // IMPORTANCE_HIGH
      });
      this.isInitialized = true;
      console.log('✅ Notification channel initialized');
    } catch (err) {
      console.error('❌ Failed to initialize notification channel:', err);
    }
  }

  // Create or update notification
  async updateNotification(options) {
    const {
      paused = false,
      elapsedMinutes = 0,
      distance = 0,
      speed = 0,
    } = options;

    try {
      await VIForegroundService.getInstance().startService({
        channelId: this.channelId,
        id: this.notificationId,
        title: paused 
          ? '⏸️ BusBuddy - Tracking Paused' 
          : '🚍 BusBuddy - Live Tracking',
        text: paused
          ? `Tracking paused | ${distance.toFixed(2)} km tracked`
          : `${elapsedMinutes} min • ${distance.toFixed(2)} km • ${speed} km/h`,
        icon: 'ic_notification',
        priority: 2,
        button: paused ? 'Resume' : 'Pause',
        ongoing: true, // Non-dismissible
      });
      
      this.lastUpdateTime = Date.now();
      console.log(`🔔 Notification ${paused ? 'paused' : 'updated'}`);
      return true;
    } catch (err) {
      console.error('❌ Failed to update notification:', err);
      return false;
    }
  }

  // Start checking for dismissed notification and recreate
  startReappearCheck(getNotificationData) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    console.log('🔔 Starting notification reappear check (every 10 seconds)');
    
    // Check every 10 seconds if notification needs to be recreated
    this.checkInterval = setInterval(async () => {
      try {
        const data = getNotificationData();
        if (data && data.isTracking) {
          // Always recreate notification to ensure it stays visible
          // Android foreground service should handle this, but we force update
          await this.updateNotification({
            paused: data.isPaused,
            elapsedMinutes: data.elapsedMinutes,
            distance: data.distance,
            speed: data.speed,
          });
          console.log('🔔 Notification reappear check - ensured visible');
        }
      } catch (err) {
        console.error('❌ Notification reappear check failed:', err);
      }
    }, 10000); // Check every 10 seconds
  }

  // Stop reappear checking
  stopReappearCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🔔 Notification reappear check stopped');
    }
  }

  // Stop and remove notification
  async stopNotification() {
    this.stopReappearCheck();
    
    try {
      await VIForegroundService.getInstance().stopService();
      this.lastUpdateTime = null;
      console.log('✅ Notification stopped and removed');
      return true;
    } catch (err) {
      console.error('❌ Failed to stop notification:', err);
      return false;
    }
  }

  // Check if notification was recently updated (within last 15 seconds)
  wasRecentlyUpdated() {
    if (!this.lastUpdateTime) return false;
    const timeSinceUpdate = Date.now() - this.lastUpdateTime;
    return timeSinceUpdate < 15000; // 15 seconds
  }
}

// Export singleton instance
export default new NotificationService();
