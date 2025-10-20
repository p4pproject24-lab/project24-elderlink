import { useState, useEffect } from 'react';
import { locationTrackingService } from '../services/locationTrackingService';

export function useLocationTracking() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsActive(locationTrackingService.isActive());

    // Set up interval to check status
    const interval = setInterval(() => {
      setIsActive(locationTrackingService.isActive());
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  const startTracking = () => {
    locationTrackingService.startTracking();
    setIsActive(true);
  };

  const stopTracking = () => {
    locationTrackingService.stopTracking();
    setIsActive(false);
  };

  return {
    isActive,
    startTracking,
    stopTracking,
  };
} 