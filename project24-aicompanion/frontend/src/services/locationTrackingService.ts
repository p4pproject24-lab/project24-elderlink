import * as Location from 'expo-location';
import { mapService } from './mapService';
import { getAuth } from 'firebase/auth';

class LocationTrackingService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isTracking = false;
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  startTracking() {
    if (this.isTracking || !this.userId) {
      console.log('[LocationTracking] Already tracking or no userId set');
      return;
    }

    // Check if user is authenticated before starting
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('[LocationTracking] User not authenticated, skipping location tracking');
      return;
    }

    console.log('[LocationTracking] Starting location tracking for user:', this.userId);
    this.isTracking = true;

    // Initial location update
    this.updateLocation();

    // Set up periodic updates every 5 minutes
    this.intervalId = setInterval(() => {
      this.updateLocation();
    }, 5 * 60 * 1000); // 5 minutes
  }

  stopTracking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isTracking = false;
    console.log('[LocationTracking] Stopped location tracking');
  }

  private async updateLocation() {
    if (!this.userId) {
      console.log('[LocationTracking] No userId set, skipping location update');
      return;
    }

    // Check authentication before making API call
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('[LocationTracking] User not authenticated, skipping location update');
      return;
    }

    try {
      // Check location permissions
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[LocationTracking] Location permission not granted');
        return;
      }

      // Get current location
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('[LocationTracking] Got location:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString()
      });

      // Send to backend
      await mapService.createLocation({
        userId: this.userId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      });

      console.log('[LocationTracking] Location saved successfully');
    } catch (error) {
      console.error('[LocationTracking] Error updating location:', error);
      
      // If we get a 401 error, stop tracking as user is no longer authenticated
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 401) {
          console.log('[LocationTracking] Authentication failed (401), stopping location tracking');
          this.stopTracking();
        }
      }
    }
  }

  isActive() {
    return this.isTracking;
  }
}

// Create a singleton instance
export const locationTrackingService = new LocationTrackingService(); 