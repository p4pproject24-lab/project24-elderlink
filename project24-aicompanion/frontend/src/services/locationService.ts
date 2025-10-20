import * as Location from 'expo-location';

export interface DeviceLocation {
  coords: {
    latitude: number;
    longitude: number;
    [key: string]: any;
  };
  address?: {
    city?: string | null;
    country?: string | null;
    district?: string | null;
    isoCountryCode?: string | null;
    name?: string | null;
    postalCode?: string | null;
    region?: string | null;
    street?: string | null;
    subregion?: string | null;
    timezone?: string | null;
    [key: string]: any;
  };
}

export async function getLocationAndAddress(): Promise<DeviceLocation | null> {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Permission to access location was denied');
    return null;
  }

  let location = await Location.getCurrentPositionAsync({});
  let addressArr = await Location.reverseGeocodeAsync({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });

  return {
    coords: location.coords,
    address: addressArr[0] || undefined,
  };
} 