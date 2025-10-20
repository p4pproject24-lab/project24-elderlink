import { useEffect, useState, useCallback, useRef } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, User, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { setAuthToken, clearAuthToken } from '../lib/api';

WebBrowser.maybeCompleteAuthSession();

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Google Auth Session
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (response && response.type === 'success') {
      const { id_token } = response.params;
      setLoading(true);
      setError(null);
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const token = await userCredential.user.getIdToken();
          console.log('[setAuthToken] Setting token:', token);
          setAuthToken(token);
          setUser(userCredential.user);
        })
        .catch((e) => {
          setError(e.message || 'Google sign-in failed');
        })
        .finally(() => setLoading(false));
    } else if (
      response &&
      response.type !== 'success' &&
      (response.type === 'cancel' || response.type === 'dismiss' || response.type === 'error' || response.type === 'opened' || response.type === 'locked')
    ) {
      setLoading(false); // Stop loading if cancelled, dismissed, or error
    }
  }, [response]);

  // Ref to store the resolver for Google sign-in
  const googleSignInResolver = useRef<(() => void) | null>(null);

  // Update signInWithGoogle to set the resolver and only resolve after user/token are set
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setLoading(true);
    return new Promise<void>((resolve, reject) => {
      googleSignInResolver.current = resolve;
      promptAsync().catch((e: any) => {
        setError(e.message || 'Google sign-in failed');
        setLoading(false);
        googleSignInResolver.current = null;
        reject(e);
      });
    });
  }, [promptAsync]);

  useEffect(() => {
    // Only resolve if user is set and loading is false (token is set)
    if (user && !loading && googleSignInResolver.current) {
      googleSignInResolver.current();
      googleSignInResolver.current = null;
    }
  }, [user, loading]);

  const signInWithPhone = useCallback(async (phoneNumber: string) => {
    // To be implemented: Phone sign-in logic
    throw new Error('Phone sign-in not implemented yet');
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    clearAuthToken();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithPhone,
    signOut,
    googleAuthRequest: request,
    response,
  };
} 