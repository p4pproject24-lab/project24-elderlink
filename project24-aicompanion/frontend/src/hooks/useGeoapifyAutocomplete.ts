import { useState, useEffect } from 'react';
import { fetchAddressSuggestions } from '../services/geoapifyService';
import { GeoapifySuggestion } from '../types/Geoapify';

export function useGeoapifyAutocomplete(query: string) {
  const [suggestions, setSuggestions] = useState<GeoapifySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const handler = setTimeout(() => {
      fetchAddressSuggestions(query)
        .then((res) => {
          setSuggestions(res.results || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch suggestions');
          setSuggestions([]);
          setLoading(false);
        });
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  return { suggestions, loading, error };
} 