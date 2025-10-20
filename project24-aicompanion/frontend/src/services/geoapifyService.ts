import { GeoapifyAutocompleteResponse } from '../types/Geoapify';

const BASE_URL = 'https://api.geoapify.com/v1/geocode';

export async function fetchAddressSuggestions(query: string): Promise<GeoapifyAutocompleteResponse> {
  const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  if (!GEOAPIFY_API_KEY) throw new Error('Geoapify API key is missing');
  const url = `${BASE_URL}/autocomplete?text=${encodeURIComponent(query)}&format=json&apiKey=${GEOAPIFY_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error('Failed to fetch address suggestions');
    return data;
  } catch (err) {
    throw err;
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  if (!GEOAPIFY_API_KEY) throw new Error('Geoapify API key is missing');
  
  const url = `${BASE_URL}/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${GEOAPIFY_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Reverse geocoding failed:', data);
      return `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
    }
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const address = result.formatted || result.address_line1 || result.address_line2;
      
      if (address) {
        return address;
      }
      
      // Fallback: construct address from components
      const components = [];
      if (result.house_number) components.push(result.house_number);
      if (result.street) components.push(result.street);
      if (result.city) components.push(result.city);
      if (result.state) components.push(result.state);
      if (result.postcode) components.push(result.postcode);
      
      if (components.length > 0) {
        return components.join(', ');
      }
    }
    
    // Fallback to coordinates if no address found
    return `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
  }
} 