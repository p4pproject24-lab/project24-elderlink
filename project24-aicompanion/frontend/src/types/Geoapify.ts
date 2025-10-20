export interface GeoapifySuggestion {
  formatted: string;
  lat: number;
  lon: number;
  country?: string;
  city?: string;
  postcode?: string;
  state?: string;
  street?: string;
  housenumber?: string;
}

export interface GeoapifyAutocompleteResponse {
  results: GeoapifySuggestion[];
} 