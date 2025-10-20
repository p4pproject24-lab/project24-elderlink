import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert, AppState, AppStateStatus, Animated, Image, useColorScheme, Easing, Dimensions, ActivityIndicator } from 'react-native';
import Header from '../../components/ui/Header';
import ScreenContainer from '../../components/ui/ScreenContainer';

import Button from '../../components/ui/Button';
import Text from '../../components/ui/Text';
import { useAiChat } from '../../hooks/useAiChat';
import { useHeyGen } from '../../hooks/useHeyGen';
import { Audio } from 'expo-av';
import { LiveKitRoom, VideoTrack, useTracks } from '@livekit/react-native';
import { stopHeyGenSession, getHeyGenAvatarList } from '../../services/heygenService';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { getHeyGenAvatarDetails } from '../../services/heygenService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, metrics } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useWhisper } from '../../hooks/useWhisper';
import { useAuth } from '../../hooks/useAuth';
import SettingsModal from '../../components/SettingsModal';
import { HeyGenSessionRequest } from '../../types/HeyGen';
import ChatHistoryModal from '../../components/ChatHistoryModal';
import GamesSelectionModal from '../../components/GamesSelectionModal';
import { useGames } from '../../hooks/useGames';
import type { GameSession } from '../../types/Game';

const DEMO_AVATAR_ID = 'June_HR_public';
const DEMO_VOICE_ID = 'default';

const DEBOUNCE_MS = 15000; // 15 seconds debounce for stopping stream

// Language mapping for display
const getLanguageDisplayName = (languageCode: string): string => {
  const languageMap: { [key: string]: string } = {
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'ja': '日本語',
    'ko': '한국어',
    'zh': '中文',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'th': 'ไทย',
    'vi': 'Tiếng Việt',
    'tr': 'Türkçe',
    'nl': 'Nederlands',
    'pl': 'Polski',
    'sv': 'Svenska',
    'da': 'Dansk',
    'no': 'Norsk',
    'fi': 'Suomi',
    'cs': 'Čeština',
    'sk': 'Slovenčina',
    'hu': 'Magyar',
    'ro': 'Română',
    'bg': 'Български',
    'hr': 'Hrvatski',
    'sr': 'Српски',
    'uk': 'Українська',
    'el': 'Ελληνικά',
    'he': 'עברית',
    'fa': 'فارسی',
    'ur': 'اردو',
    'bn': 'বাংলা',
    'ta': 'தமிழ்',
    'te': 'తెలుగు',
    'ml': 'മലയാളം',
    'kn': 'ಕನ್ನಡ',
    'gu': 'ગુજરાતી',
    'pa': 'ਪੰਜਾਬੀ',
    'mr': 'मराठी',
    'ne': 'नेपाली',
    'si': 'සිංහල',
    'my': 'မြန်မာ',
    'km': 'ខ្មែរ',
    'lo': 'ລາວ',
    'ka': 'ქართული',
    'hy': 'Հայերեն',
    'az': 'Azərbaycan',
    'kk': 'Қазақ',
    'ky': 'Кыргызча',
    'uz': 'O\'zbek',
    'tg': 'Тоҷикӣ',
    'mn': 'Монгол',
    'bo': 'བོད་ཡིག',
    'dz': 'རྫོང་ཁ',
    'ug': 'ئۇيغۇرچە',
    'yi': 'יידיש',
    'lb': 'Lëtzebuergesch',
    'mt': 'Malti',
    'ga': 'Gaeilge',
    'cy': 'Cymraeg',
    'is': 'Íslenska',
    'fo': 'Føroyskt',
    'sq': 'Shqip',
    'mk': 'Македонски',
    'bs': 'Bosanski',
    'me': 'Crnogorski',
    'sl': 'Slovenščina',
    'et': 'Eesti',
    'lv': 'Latviešu',
    'lt': 'Lietuvių',
    'eu': 'Euskara',
    'ca': 'Català',
    'gl': 'Galego',
    'br': 'Brezhoneg',
    'co': 'Corsu',
    'oc': 'Occitan',
    'fur': 'Furlan',
    'sc': 'Sardu',
    'vec': 'Vèneto',
    'lmo': 'Lombard',
    'pms': 'Piemontèis',
    'rm': 'Rumantsch',
    'gsw': 'Schwiizertüütsch',
    'als': 'Elsässisch',
    'bar': 'Bairisch',
    'ksh': 'Kölsch',
    'pfl': 'Pfälzisch',
    'swg': 'Schwäbisch',
    'sxu': 'Obersächsisch',
    'wae': 'Walser',
  };
  
  return languageMap[languageCode] || languageCode.toUpperCase();
};

const VideoDisplay = () => {
  const tracks = useTracks();
  const heygenVideoTrack = tracks.find(
    (t) =>
      t.publication &&
      t.publication.kind === 'video' &&
      t.participant.identity === 'heygen'
  );
  if (!heygenVideoTrack || !heygenVideoTrack.publication) {
    return <Text style={{ marginTop: 24, color: '#222', textAlign: 'center' }}>Waiting for avatar video...</Text>;
  }
  return (
    <View style={{ width: 320, height: 240, marginTop: 12, alignSelf: 'center', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
      <VideoTrack
        trackRef={heygenVideoTrack}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
};

// Move VideoDisplayWithReady outside of AiChatScreen
interface VideoDisplayWithReadyProps {
  isAvatarReady: boolean;
  setIsAvatarReady: React.Dispatch<React.SetStateAction<boolean>>;
}
const VideoDisplayWithReady = ({ isAvatarReady, setIsAvatarReady }: VideoDisplayWithReadyProps) => {
  const tracks = useTracks();
  const heygenVideoTrack = tracks.find(
    (t) =>
      t.publication &&
      t.publication.kind === 'video' &&
      t.participant.identity === 'heygen'
  );
  useEffect(() => {
    if (heygenVideoTrack && !isAvatarReady) {
      setIsAvatarReady(true);
    }
  }, [heygenVideoTrack]);
  useEffect(() => {
    console.log('[MOUNT] VideoDisplayWithReady mounted');
    return () => {
      console.log('[UNMOUNT] VideoDisplayWithReady unmounted');
    };
  }, []);
  if (!heygenVideoTrack || !heygenVideoTrack.publication) {
    return null;
  }
  return (
    <View style={{ width: '100%', height: '100%' }}>
      <VideoTrack trackRef={heygenVideoTrack} style={{ width: '100%', height: '100%' }} />
    </View>
  );
};

const PAGE_SIZE = 30;

interface AiChatScreenProps {
  route?: {
    params?: {
      initialMode?: 'interactive' | 'game';
    };
  };
  navigation?: any;
}

const AiChatScreen: React.FC<AiChatScreenProps> = ({ navigation }) => {
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const isStreamingRef = useRef(false);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Mode state
  const [currentMode, setCurrentMode] = useState<'interactive' | 'game'>(
    route?.params?.initialMode || 'interactive'
  );
  const [showGamesModal, setShowGamesModal] = useState(false);
  const [currentGameSession, setCurrentGameSession] = useState<GameSession | null>(null);
  const [shouldSendInitialGameMessage, setShouldSendInitialGameMessage] = useState(false);
  const [shouldSendInitialInteractiveMessage, setShouldSendInitialInteractiveMessage] = useState(false);
  const lastAutoStartSessionIdRef = useRef<string | null>(null);

  const [streaming, setStreaming] = useState(false);
  // 1. Add timestamp to chat state
  const [chat, setChat] = useState<any[]>([]); // will include both messages and date separators
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [avatarPrefsLoaded, setAvatarPrefsLoaded] = useState(false);
  const lastAvatarIdRef = useRef<string | null>(null);
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current; // 1 = placeholder visible
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [micDisabled, setMicDisabled] = useState(false);
  const [shouldScrollToEnd, setShouldScrollToEnd] = useState(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false); // Track avatar speech state
  const [audioPlaying, setAudioPlaying] = useState(false); // Track actual audio playback
  const [isAvatarSessionLoading, setIsAvatarSessionLoading] = useState(false); // Track avatar session creation
  const speakingIndicatorAnim = useRef(new Animated.Value(0)).current; // Animation for speaking indicator
  const [lastDetectedLanguage, setLastDetectedLanguage] = useState<string>(''); // Track last detected language

  // Hooks
  const { user } = useAuth();
  const userId = user?.firebaseUid;
  if (!userId) return null; // or show a loading spinner
  const { getChatHistory, aiLoading, aiError, aiResponse, sendAiMessage, avatarLoading, avatarError, avatarResponse, sendAiAvatarMessage, sendGameAvatarMessage, sendAutoAvatarMessage } = useAiChat(userId);
  const avatarResponseRef = useRef(avatarResponse);

  const {
    sessionLoading,
    sessionError,
    session,
    createSessionAction,
    startLoading,
    startError,
    startedSession,
    startSessionAction,
    setSession,
    setStartedSession,
    sendTaskAction, // <-- add this
  } = useHeyGen();

  // Whisper speech-to-text integration with automatic language detection
  const {
    isRecording: sttListening,
    isTranscribing,
    transcribedText: sttInput,
    detectedLanguage,
    error: sttError,
    startRecording: startListening,
    stopRecording: stopListening,
    reset: resetStt,
  } = useWhisper();

  // Debug: Log state changes
  useEffect(() => {
    console.log('[AiChatScreen] Whisper state changed - sttInput:', sttInput, 'isTranscribing:', isTranscribing);
  }, [sttInput, isTranscribing]);

  // Load saved detected language on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('detected_language_preference');
        if (savedLanguage) {
          setLastDetectedLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading detected language preference:', error);
      }
    };

    loadSavedLanguage();
  }, []);

  // Update last detected language when a new language is detected and save to AsyncStorage
  useEffect(() => {
    if (detectedLanguage && detectedLanguage !== lastDetectedLanguage) {
      console.log('[AiChatScreen] New language detected:', detectedLanguage);
      setLastDetectedLanguage(detectedLanguage);
      
      // Save the detected language to AsyncStorage
      AsyncStorage.setItem('detected_language_preference', detectedLanguage).catch(error => {
        console.error('Error saving detected language preference:', error);
      });
    }
  }, [detectedLanguage, lastDetectedLanguage]);

  // Settings modal state
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Add state for voice settings
  const [currentVoiceSpeed, setCurrentVoiceSpeed] = useState(0.95); // Default speed
  const [autoStartConversation, setAutoStartConversation] = useState(false);
  
  // Load saved voice speed and preload avatars on mount
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const savedSpeed = await AsyncStorage.getItem('voice_speed_preference');
        console.log('[AiChatScreen] Raw saved speed from AsyncStorage:', savedSpeed);
        if (savedSpeed) {
          const speed = parseFloat(savedSpeed);
          // Round to 2 decimal places to avoid floating point precision issues
          const roundedSpeed = Math.round(speed * 100) / 100;
          console.log('[AiChatScreen] Loaded saved voice speed:', speed, 'rounded to:', roundedSpeed);
          // Set the voice speed without triggering the effect
          setCurrentVoiceSpeed(roundedSpeed);
          lastVoiceSpeedRef.current = roundedSpeed; // Ensure ref matches loaded speed
        } else {
          console.log('[AiChatScreen] No saved voice speed found, using default 0.95');
          // If no saved speed, set the ref to match the default
          lastVoiceSpeedRef.current = 0.95;
        }

        // Load auto start preference
        const savedAutoStart = await AsyncStorage.getItem('auto_start_conversation');
        if (savedAutoStart !== null) {
          setAutoStartConversation(savedAutoStart === 'true');
        }
      } catch (error) {
        console.error('Error loading voice speed preference:', error);
        lastVoiceSpeedRef.current = 0.95; // Set ref to default on error
      }
    };

    loadPrefs();
  }, []);
  
  // Save voice speed when it changes
  const saveVoiceSpeed = async (speed: number) => {
    try {
      // Round to 2 decimal places to avoid floating point precision issues
      const roundedSpeed = Math.round(speed * 100) / 100;
      await AsyncStorage.setItem('voice_speed_preference', roundedSpeed.toString());
      console.log('[AiChatScreen] Saved voice speed:', roundedSpeed);
    } catch (error) {
      console.error('Error saving voice speed preference:', error);
    }
  };

  // Persist auto start preference
  const saveAutoStartPreference = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('auto_start_conversation', value ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving auto start preference:', error);
    }
  };
  


  // Sync speech-to-text input with chat input (no longer needed since we removed input state)

  // Mic button handler
  const handleMicPress = async () => {
    console.log('[Mic Button] Pressed - sttListening:', sttListening, 'micDisabled:', micDisabled, 'audioPlaying:', audioPlaying);
    
    // If not listening, start listening
    if (!sttListening) {
      console.log('[Mic Button] Starting listening...');
      
      // Initialize session if not ready
      if (!startedSession?.sessionId && !session?.sessionId) {
        console.log('[Mic Button] No session ready, initializing...');
        setStreaming(true); // This will trigger session initialization
        // Wait a bit for session to be created
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      resetStt();
      await startListening();
      return;
    }
    
    // If listening, stop and process
    console.log('[Mic Button] Stopping listening...');
    const transcribedText = await stopListening();
    
    // When stopping, send the recognized speech as a message if not empty
    console.log('[Mic Button] Debug - transcribedText:', transcribedText, 'startedSession:', startedSession);
    
    if (transcribedText && transcribedText.trim()) {
      // If no session, try to initialize one
      if (!startedSession?.sessionId) {
        console.log('[Mic Button] No session available, initializing...');
        setStreaming(true);
        // Wait for session to be ready
        let attempts = 0;
        while (!startedSession?.sessionId && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        if (!startedSession?.sessionId) {
          console.log('[Mic Button] Failed to initialize session, cannot send message');
          resetStt();
          return;
        }
      }
      
      console.log('[Mic Button] Sending message:', transcribedText.trim());
      setChat(prev => [...prev, { from: 'user', text: transcribedText.trim(), timestamp: Date.now(), type: 'message', key: `user-${Date.now()}` }]);
      setShouldScrollToEnd(true);
      setMicDisabled(true); // Disable mic immediately after sending
      setAvatarSpeaking(true); // Set avatar to speaking state
      console.log('[Mic Button] Disabled mic and set avatar to speaking');
      
      if (currentMode === 'game') {
        if (currentGameSession) {
          // Use game avatar service - routes to Game LLM + Avatar
          console.log('[Mic Button] Using GAME LLM service for game:', currentGameSession.title);
          await sendGameAvatarMessage({
            message: transcribedText.trim(),
            gameSessionId: currentGameSession.id,
            sessionId: startedSession.sessionId,
          });
        } else {
          // No game selected - use interactive LLM to guide user to select a game
          console.log('[Mic Button] No game selected in game mode - using interactive LLM to guide user');
          await sendAiAvatarMessage({
            message: `The user said: "${transcribedText.trim()}" but they're in game mode without a game selected. Please respond warmly and guide them to select a brain game by tapping the game controller button to the left of the microphone. Keep it brief and encouraging.`,
            sessionId: startedSession.sessionId,
            voiceId: DEMO_VOICE_ID,
          });
          
          // Don't return here - let the normal avatar response handling take care of opening modal
        }
      } else {
        // Use regular avatar service - routes to Interactive LLM + Avatar
        console.log('[Mic Button] Using INTERACTIVE LLM service with memory/context');
        await sendAiAvatarMessage({
          message: transcribedText.trim(),
          sessionId: startedSession.sessionId,
          voiceId: DEMO_VOICE_ID,
        });
      }
      resetStt(); // Reset the whisper input
    } else {
      // If no speech was detected or it's empty, just reset without sending
      console.log('[Mic Button] No speech detected or empty input, not sending message');
      resetStt(); // Reset the whisper input
    }
  };

  // Load avatar preferences and fetch preview if needed
  useEffect(() => {
    const loadAvatarPrefs = async () => {
      try {
        const savedId = await AsyncStorage.getItem('selectedAvatarId');
        const savedPreview = await AsyncStorage.getItem('avatarPreviewUrl');
        
        if (savedId) {
          setSelectedAvatarId(savedId);
          // If we have a selected avatar but no preview, fetch it
          if (!savedPreview) {
            const { previewImageUrl } = await getHeyGenAvatarDetails(savedId);
            if (previewImageUrl) {
              setAvatarPreviewUrl(previewImageUrl);
              AsyncStorage.setItem('avatarPreviewUrl', previewImageUrl);
            }
          } else {
            setAvatarPreviewUrl(savedPreview);
          }
        } else {
          // No selected avatar, use default
          const { previewImageUrl } = await getHeyGenAvatarDetails(DEMO_AVATAR_ID);
          if (previewImageUrl) {
            setAvatarPreviewUrl(previewImageUrl);
            AsyncStorage.setItem('avatarPreviewUrl', previewImageUrl);
          }
        }
      } catch (error) {
        console.error('Error loading avatar preferences:', error);
      } finally {
        setAvatarPrefsLoaded(true);
      }
    };
    loadAvatarPrefs();
  }, []);

  // Fade out placeholder when avatar is ready, with a longer buffer delay for seamless transition
  useEffect(() => {
    let timeout: number | null = null;
    if (isAvatarReady) {
      // Increase buffer to 700ms for a smoother transition
      timeout = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 700);
    } else {
      fadeAnim.setValue(1);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isAvatarReady]);

  // Initialize HeyGen session when streaming starts
  useEffect(() => {
    if (streaming && !session && avatarPrefsLoaded) {
      initializeAvatarSession();
    }
  }, [streaming, selectedAvatarId, avatarPrefsLoaded]);

  // Auto-initialize session when user first opens chat (after avatar prefs are loaded)
  useEffect(() => {
    if (avatarPrefsLoaded && !session && !startedSession && !streaming) {
      console.log('[AiChatScreen] Auto-initializing session for first-time user');
      setStreaming(true);
      if (autoStartConversation && currentMode === 'interactive') {
        setShouldSendInitialInteractiveMessage(true);
      }
    }
  }, [avatarPrefsLoaded, session, startedSession, streaming, autoStartConversation, currentMode]);

  // Handle initial mode from navigation params
  useEffect(() => {
    if (route?.params?.initialMode === 'game') {
      setCurrentMode('game');
      // Show games modal immediately when entering game mode
      setTimeout(() => setShowGamesModal(true), 500);
    }
  }, [route?.params?.initialMode, isFocused]);

  // Reset to interactive mode when navigating away and back (unless explicitly set to game mode)
  // Only reset if we came from navigation params (not manual toggle)
  const wasFromNavigation = useRef(false);
  
  useEffect(() => {
    if (route?.params?.initialMode === 'game') {
      wasFromNavigation.current = true;
    }
  }, [route?.params?.initialMode]);
  
  useEffect(() => {
    if (isFocused && !route?.params?.initialMode && currentMode === 'game' && wasFromNavigation.current) {
      // Only reset if this was set via navigation, not manual toggle
      setCurrentMode('interactive');
      setCurrentGameSession(null);
      wasFromNavigation.current = false;
    }
  }, [isFocused, route?.params?.initialMode, currentMode]);

  // Handle mode switching - restart session when mode changes
  const handleModeSwitch = async (newMode: 'interactive' | 'game') => {
    console.log(`[AiChatScreen] handleModeSwitch called: ${currentMode} -> ${newMode}`);
    if (newMode === currentMode) {
      console.log(`[AiChatScreen] Already in ${newMode} mode, ignoring switch`);
      return;
    }
    
    console.log(`[AiChatScreen] Switching from ${currentMode} to ${newMode} mode`);
    
    // Mark that this was a manual toggle (not from navigation)
    wasFromNavigation.current = false;
    
    // Stop current session
    if (streaming) {
      setStreaming(false);
      if (startedSession?.sessionId) {
        try {
          await stopHeyGenSession(startedSession.sessionId);
        } catch (e) {
          console.log('[AiChatScreen] Error stopping session during mode switch:', e);
        }
      }
      setSession(null);
      setStartedSession(null);
    }
    
    // Clear game session when switching to interactive mode
    if (newMode === 'interactive') {
      setCurrentGameSession(null);
    }
    
    setCurrentMode(newMode);
    console.log(`[AiChatScreen] Mode set to: ${newMode}`);
    
    // Show games modal when switching to game mode
    if (newMode === 'game') {
      setShowGamesModal(true);
    } else {
      // Restart session for interactive mode
      setTimeout(() => {
        setStreaming(true);
      }, 1000);
    }
  };

  // Handle game selection from modal
  const handleGameSelected = (gameSession: GameSession) => {
    console.log('[AiChatScreen] Game selected:', gameSession.title);
    setCurrentGameSession(gameSession);
    setShowGamesModal(false);
    
    // Set a flag to send initial message when session is ready
    setShouldSendInitialGameMessage(true);
    
    // Restart session for game mode
    setTimeout(() => {
      setStreaming(true);
    }, 1000);
  };

  // Send initial game message when session is ready and we have a game selected
  useEffect(() => {
    if (shouldSendInitialGameMessage && startedSession?.sessionId && currentGameSession && currentMode === 'game') {
      console.log('[AiChatScreen] Session ready, sending initial game message for:', currentGameSession.title);
      setShouldSendInitialGameMessage(false);
      setMicDisabled(true);
      setAvatarSpeaking(true);
      
      sendGameAvatarMessage({
        message: 'Start the game and introduce yourself as the Game Master for this game.',
        gameSessionId: currentGameSession.id,
        sessionId: startedSession.sessionId,
      });
    }
  }, [shouldSendInitialGameMessage, startedSession?.sessionId, currentGameSession, currentMode, sendGameAvatarMessage]);

  // Debug: Log mode changes
  useEffect(() => {
    console.log('[AiChatScreen] Current mode changed to:', currentMode);
  }, [currentMode]);

  // Debug: Log game session changes
  useEffect(() => {
    console.log('[AiChatScreen] Current game session:', currentGameSession?.title || 'none');
  }, [currentGameSession]);

  // Start session after creation
  useEffect(() => {
    if (session?.sessionId && streaming) {
      startSessionAction({ sessionId: session.sessionId });
    }
  }, [session, streaming]);

  // After session is started, auto-send initial message if enabled (interactive mode)
  useEffect(() => {
    const sid = startedSession?.sessionId || null;
    if (!sid) return;
    // Guard: per-session auto-start, including very first entry
    if (
      autoStartConversation &&
      currentMode === 'interactive' &&
      lastAutoStartSessionIdRef.current !== sid
    ) {
      console.log('[AiChatScreen] Auto-start: sending greeting for session', sid);
      lastAutoStartSessionIdRef.current = sid;
      setShouldSendInitialInteractiveMessage(false);
      setMicDisabled(true);
      setAvatarSpeaking(true);
      sendAutoAvatarMessage({ sessionId: sid });
    }
  }, [autoStartConversation, currentMode, startedSession?.sessionId]);

  // Handle start session errors and retry if session is closed
  useEffect(() => {
    if (startError && startError.includes('Session has been closed') && streaming) {
      // Reset session state and try to create a new session
      setSession(null);
      setStartedSession(null);
      setTimeout(() => {
        initializeAvatarSession();
      }, 1000);
    }
  }, [startError, streaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (startedSession?.sessionId) {
        stopHeyGenSession(startedSession.sessionId).catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, [startedSession?.sessionId]);

  // Track last voice speed to prevent unnecessary restarts
      const lastVoiceSpeedRef = useRef(0.95);
  const isInitialLoad = useRef(true);
  
  // Restart session when voice settings change (using same pattern as navigation focus)
  useEffect(() => {
    const handleVoiceSpeedChange = async () => {
      console.log('=== VOICE SPEED EFFECT ===');
      console.log('[AiChatScreen] Voice speed effect triggered - currentSpeed:', currentVoiceSpeed, 'lastSpeed:', lastVoiceSpeedRef.current, 'isInitialLoad:', isInitialLoad.current);
      
      // Skip the first run (initial load) to prevent immediate restart
      if (isInitialLoad.current) {
        console.log('[AiChatScreen] Initial load - skipping voice speed effect');
        isInitialLoad.current = false;
        return;
      }
      
      // Use a small threshold to avoid floating point precision issues
      const speedDifference = Math.abs(lastVoiceSpeedRef.current - currentVoiceSpeed);
      const hasSignificantChange = speedDifference > 0.01; // Only restart if change is > 0.01
      
      if (hasSignificantChange) {
        console.log('[AiChatScreen] Voice speed changed from', lastVoiceSpeedRef.current, 'to:', currentVoiceSpeed, '- restarting session');
        
        // Save the new voice speed first
        saveVoiceSpeed(currentVoiceSpeed);
        
        // Stop current session immediately (same as navigation focus pattern)
        if (streaming) {
          setStreaming(false);
          if (startedSession?.sessionId) {
            try {
              await stopHeyGenSession(startedSession.sessionId);
            } catch (e) {
              console.log('[AiChatScreen] Error stopping session:', e);
            }
          }
          setSession(null);
          setStartedSession(null);
          console.log('[AiChatScreen] Session stopped for voice speed change');
        }
        
        // Restart after a short delay (same as navigation focus pattern)
        setTimeout(() => {
          console.log('[AiChatScreen] Restarting avatar stream after voice speed change');
          setStreaming(true);
        }, 1000);
      } else {
        console.log('[AiChatScreen] Voice speed effect - no restart needed (change too small:', speedDifference, ')');
      }
      // Update the ref AFTER checking for changes
      lastVoiceSpeedRef.current = currentVoiceSpeed;
      console.log('=== END VOICE SPEED EFFECT ===');
    };
    
    handleVoiceSpeedChange();
  }, [currentVoiceSpeed]);

  // Play audio (base64) using expo-av
  const playAudio = async (audioData: string) => {
    try {
      const soundObject = new Audio.Sound();
      const base64 = audioData.replace(/^data:audio\/(wav|mp3);base64,/, '');
      const uri = `data:audio/wav;base64,${base64}`;
      await soundObject.loadAsync({ uri });
      await soundObject.playAsync();
    } catch (e) {
      // Silently handle audio playback errors
      console.log('[Audio] Playback error:', e);
    }
  };

  const initializeAvatarSession = async () => {
    try {
      setIsAvatarSessionLoading(true);
      const avatarIdToUse = selectedAvatarId || DEMO_AVATAR_ID;
      const sessionRequest: HeyGenSessionRequest = {
        avatarId: avatarIdToUse,
        version: 'v2',
        disableIdleTimeout: true, // Disable the 2-minute idle timeout
        activityIdleTimeout: 3600, // Set to maximum 1 hour (3600 seconds)
      };
      // Always include voice settings with current speed
      sessionRequest.voice = {
        rate: currentVoiceSpeed,
      };
      console.log('=== SESSION CREATION ===');
      console.log('[AiChatScreen] Selected avatar ID:', selectedAvatarId);
      console.log('[AiChatScreen] Avatar ID being used:', avatarIdToUse);
      console.log('[AiChatScreen] Current voice speed state:', currentVoiceSpeed);
      console.log('[AiChatScreen] Creating session with voice settings:', sessionRequest.voice);
      console.log('[AiChatScreen] Note: Using avatar\'s actual default voice with custom rate');
      console.log('[AiChatScreen] Full session request:', JSON.stringify(sessionRequest, null, 2));
      await createSessionAction(sessionRequest);
      console.log('=== END SESSION CREATION ===');
    } catch (error: any) {
      console.log('[Avatar] Session initialization error:', error?.message || 'Failed to initialize avatar session');
      setStreaming(false);
    } finally {
      setIsAvatarSessionLoading(false);
    }
  };

  // Track if chat history has been loaded for this user
  const [chatLoaded, setChatLoaded] = useState(false);

  // Only load chat history once per user when popup is first opened
  useEffect(() => {
    if (showChatHistory && !chatLoaded) {
      setPage(0);
      setHasMore(true);
      setLoadingMore(false);
      (async () => {
        const messages = await getChatHistory(0);
        setChat(insertDateSeparators(messages));
        setHasMore(messages.length === PAGE_SIZE);
        setShouldScrollToEnd(true);
        setChatLoaded(true);
      })();
    }
  }, [showChatHistory, chatLoaded]);

  // Reset chatLoaded and chat when user changes
  useEffect(() => {
    setChatLoaded(false);
    setChat([]);
  }, [userId]);


  // Update ref when avatarResponse changes
  useEffect(() => {
    avatarResponseRef.current = avatarResponse;
  }, [avatarResponse]);
  // Handle AI response and avatar speech
  useEffect(() => {
    const handleAvatarResponse = async () => {
      console.log('[Avatar Speech] Effect triggered - avatarResponse:', !!avatarResponse, 'micDisabled:', micDisabled, 'audioPlaying:', audioPlaying);
      
      if (avatarResponse) {
        console.log('[Avatar Speech] Processing response:', avatarResponse.text);
        
        // Check if this is a "no game selected" guidance response
        const isGameGuidanceResponse = currentMode === 'game' && !currentGameSession && 
          (avatarResponse.text.toLowerCase().includes('game') || 
           avatarResponse.text.toLowerCase().includes('select') ||
           avatarResponse.text.toLowerCase().includes('choose'));
        
        // Add AI response to chat
      setChat(prev => [
        ...prev,
        {
          from: 'ai',
          text: avatarResponse.text,
          timestamp: Date.now(),
          type: 'message',
          key: `ai-${Date.now()}`,
        },
      ]);
      setShouldScrollToEnd(true);
        
        // Use actual duration from HeyGen API response, with fallback to estimation
        const actualDurationMs = avatarResponse.duration_ms;
        const wordCount = avatarResponse.text.split(' ').length;
        const estimatedDurationMs = Math.max(3000, (wordCount / 150) * 60 * 1000); // Fallback estimation
        const finalDurationMs = actualDurationMs || estimatedDurationMs;
        
        console.log('[Avatar Speech] Duration from API:', actualDurationMs, 'ms, fallback estimation:', estimatedDurationMs, 'ms, using:', finalDurationMs, 'ms for', wordCount, 'words');
        setAudioPlaying(true); // Mark as playing to keep mic disabled
        
        // Set a timer to re-enable mic after actual speaking time
        setTimeout(() => {
          console.log('[Avatar Speech] Actual speaking time completed - re-enabling mic');
          setAudioPlaying(false);
          setMicDisabled(false);
          setAvatarSpeaking(false);
          
          // If this was a game guidance response, open the games modal after speaking
          if (isGameGuidanceResponse) {
            console.log('[Avatar Speech] Opening games modal after guidance response');
            setTimeout(() => {
              setShowGamesModal(true);
            }, 500); // Small delay for smooth UX
          }
        }, finalDurationMs);
        
        // Also try to play audio if available (for cases where audio is provided)
        try {
          if (avatarResponse.audio && avatarResponse.audio.audioData) {
            console.log('[Avatar Speech] Audio data available, playing it');
            const soundObject = new Audio.Sound();
            const base64 = avatarResponse.audio.audioData.replace(/^data:audio\/(wav|mp3);base64,/, '');
            const uri = `data:audio/wav;base64,${base64}`;
            await soundObject.loadAsync({ uri });
            
            // Set up status update listener to track actual playback
            soundObject.setOnPlaybackStatusUpdate((status) => {
              console.log('[Avatar Speech] Status update:', status);
              if (status.isLoaded && status.didJustFinish) {
                console.log('[Avatar Speech] Audio playback actually finished - re-enabling mic');
                setAudioPlaying(false);
                setMicDisabled(false);
                setAvatarSpeaking(false);
                
                // If this was a game guidance response, open the games modal after speaking
                if (isGameGuidanceResponse) {
                  console.log('[Avatar Speech] Opening games modal after guidance response (audio completion)');
                  setTimeout(() => {
                    setShowGamesModal(true);
                  }, 500); // Small delay for smooth UX
                }
                
                soundObject.unloadAsync().catch(() => {
                  // Ignore cleanup errors
                });
              }
            });
            
            await soundObject.playAsync();
          }
        } catch (e) {
          console.log('[Avatar Speech] Audio playback error:', e);
          // Don't re-enable mic here - let the timer handle it
        }
      }
    };
    
    handleAvatarResponse();
  }, [avatarResponse]); // Only depend on avatarResponse

  // Remove the separate effect since we're handling completion in the status update

  // Log mic state changes for debugging
  useEffect(() => {
    console.log('[Mic State] micDisabled:', micDisabled, 'audioPlaying:', audioPlaying, 'avatarSpeaking:', avatarSpeaking);
  }, [micDisabled, audioPlaying, avatarSpeaking]);

  // Log when mic gets disabled
  useEffect(() => {
    if (micDisabled) {
      console.log('[Mic Disabled] micDisabled set to true');
    }
  }, [micDisabled]);

  // Log when mic gets enabled
  useEffect(() => {
    if (!micDisabled && (audioPlaying || avatarSpeaking)) {
      console.log('[Mic Enabled] micDisabled set to false while audioPlaying:', audioPlaying, 'avatarSpeaking:', avatarSpeaking);
    }
  }, [micDisabled, audioPlaying, avatarSpeaking]);

  // Animate speaking indicator
  useEffect(() => {
    if (audioPlaying || avatarSpeaking || sttListening || isTranscribing) {
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(speakingIndicatorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out and scale down
      Animated.parallel([
        Animated.timing(speakingIndicatorAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [audioPlaying, avatarSpeaking, sttListening, isTranscribing, speakingIndicatorAnim]);

  // Scroll to bottom when chat or popup changes
  useEffect(() => {
    if (showChatHistory && shouldScrollToEnd && flatListRef.current) {
      setTimeout(() => {
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToEnd({ animated: true });
          } catch {}
        }
        setShouldScrollToEnd(false);
      }, 100);
    }
  }, [chat, showChatHistory, shouldScrollToEnd]);

  // Start the avatar stream
  const startAvatarStream = async () => {
    console.log('[CALL] startAvatarStream, streaming:', streaming);
    if (!streaming) {
      setSession(null);
      setStartedSession(null);
      if (autoStartConversation && currentMode === 'interactive') {
        setShouldSendInitialInteractiveMessage(true);
      }
      setStreaming(true);
      // isStreamingRef.current = true; // No longer needed
      console.log('[AvatarStream] Session start triggered (focus/app active)');
    }
  };

  // Stop the avatar stream
  const stopAvatarStream = async () => {
    console.log('[CALL] stopAvatarStream, streaming:', streaming);
    if (streaming) {
      setStreaming(false);
      if (startedSession?.sessionId) {
        try {
          await stopHeyGenSession(startedSession.sessionId);
        } catch (e) {
          // Optionally log error
        }
      }
      setSession(null);
      setStartedSession(null);
      console.log('[AvatarStream] Session stop triggered (unfocus/app background)');
    }
  };

  // Manage stream based on navigation focus
  useEffect(() => {
    if (isFocused) {
      // Cancel any pending stop
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      startAvatarStream();
    } else {
      // Debounced stop
      stopTimeoutRef.current = setTimeout(() => {
        stopAvatarStream();
      }, DEBOUNCE_MS);
    }
    return () => {
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  // Manage stream based on app state
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current === 'active' && (nextAppState === 'inactive' || nextAppState === 'background')) {
        // App going to background, stop stream immediately
        stopAvatarStream();
        // isStreamingRef.current = false; // No longer needed
      }
      appState.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add this effect to reset avatar preview when stream stops
  useEffect(() => {
    if (!streaming) {
      setIsAvatarReady(false);
    }
  }, [streaming]);

  // Extract url and accessToken for LiveKitRoom
  const livekitUrl = startedSession?.url;
  const livekitToken = startedSession?.accessToken;

  // Log session and startedSession changes
  useEffect(() => {
    console.log('session:', session);
  }, [session]);
  useEffect(() => {
    console.log('startedSession:', startedSession);
  }, [startedSession]);
  useEffect(() => {
    console.log('livekitUrl:', livekitUrl);
    console.log('livekitToken:', livekitToken);
  }, [livekitUrl, livekitToken]);

  // Log on every render
  // console.log('[RENDER] streaming:', streaming, 'session:', session, 'startedSession:', startedSession, 'livekitUrl:', startedSession?.url, 'livekitToken:', startedSession?.accessToken);

  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  // VideoDisplay with onAvatarReady callback
  // Mic pulse animation
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (sttListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.08,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      micPulseAnim.setValue(1);
    }
  }, [sttListening]);

  // 4. Inline ChatBubble component
  // Use a blue color for user bubble
  const USER_BUBBLE_COLOR = '#007AFF'; // iOS blue, or replace with your theme's blue
  const ChatBubble = ({ from, text, timestamp }: { from: 'user' | 'ai'; text: string; timestamp: number }) => {
    const isUser = from === 'user';
    return (
      <View
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '80%',
          marginBottom: spacing.md,
          alignItems: isUser ? 'flex-end' : 'flex-start',
          marginLeft: isUser ? 40 : 0,
          marginRight: !isUser ? 40 : 0,
        }}
      >
        <View
          style={{
            backgroundColor: isUser ? USER_BUBBLE_COLOR : palette.surface,
            borderRadius: metrics.cardRadius,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            borderTopRightRadius: isUser ? 0 : metrics.cardRadius,
            borderTopLeftRadius: !isUser ? 0 : metrics.cardRadius,
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
            borderWidth: !isUser ? 1 : 0,
            borderColor: !isUser ? palette.border : 'transparent',
          }}
        >
          <Text
            style={{
              color: isUser ? '#fff' : palette.textPrimary,
              fontSize: 16,
            }}
          >
            {text}
          </Text>
        </View>
        <Text
          variant="caption"
          style={{
            color: palette.textSecondary,
            fontSize: 12,
            marginTop: 2,
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  // Helper to insert date separators
  function insertDateSeparators(messages: any[]): any[] {
    const result: any[] = [];
    let lastDate: string | null = null;
    messages.forEach((msg, idx) => {
      const date = new Date(msg.timestamp).toDateString();
      if (date !== lastDate) {
        result.push({ type: 'date', date, key: `date-${date}-${idx}` });
        lastDate = date;
      }
      // Map fromUser to from
      const from = msg.from !== undefined ? msg.from : (msg.fromUser ? 'user' : 'ai');
      result.push({ ...msg, from, type: 'message', key: msg.id || `${from}-${msg.timestamp}-${idx}` });
    });
    return result;
  }

  // Initial load and on popup open
  useEffect(() => {
    if (showChatHistory) {
      setPage(0);
      setHasMore(true);
      setLoadingMore(false);
      (async () => {
        const messages = await getChatHistory(0);
        setChat(insertDateSeparators(messages));
        setHasMore(messages.length === PAGE_SIZE);
      })();
    }
  }, [showChatHistory]);

  // Load more on scroll
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const messages = await getChatHistory(nextPage);
    if (messages.length > 0) {
      // Filter out messages already in chat by key
      const existingKeys = new Set(chat.map(i => i.key));
      const newMessages = insertDateSeparators(messages).filter(m => !existingKeys.has(m.key));
      setChat(prev => [...newMessages, ...prev.filter(i => i.type !== 'date')]); // prepend older
      setPage(nextPage);
      setHasMore(messages.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  // Reserve space for header, action bar, and padding
  const AVATAR_ASPECT_RATIO = 4 / 3; // or 16/9 if your video is widescreen
  const AVATAR_MAX_HEIGHT = windowHeight * 0.5; // Fill up to 50% of screen height
  const AVATAR_WIDTH = windowWidth - 32; // 16px padding on each side
  const AVATAR_HEIGHT = Math.min(AVATAR_WIDTH / AVATAR_ASPECT_RATIO, AVATAR_MAX_HEIGHT);

  // Define heights for header and language bar
  const HEADER_HEIGHT = 56; // Adjust if your Header component is taller
  const LANGUAGE_BAR_HEIGHT = 48; // Adjust if your language bar is taller
  const AVATAR_TOP_OFFSET = HEADER_HEIGHT + LANGUAGE_BAR_HEIGHT + spacing.md; // Add spacing if needed

  // Handle avatar selection from modal
  const handleAvatarSelect = (avatar: { id: string; gender: string; preview_image_url: string; default_voice?: string }) => {
    setSelectedAvatarId(avatar.id);
    setAvatarPreviewUrl(avatar.preview_image_url);
    AsyncStorage.setItem('selectedAvatarId', avatar.id);
    AsyncStorage.setItem('avatarPreviewUrl', avatar.preview_image_url);
    // Do not restart session here; let the effect below handle it
  };

  // Restart avatar session if avatar changes (like voice rate logic)
  useEffect(() => {
    if (lastAvatarIdRef.current === null) {
      // Initial load, just set the ref
      lastAvatarIdRef.current = selectedAvatarId;
      return;
    }
    if (selectedAvatarId && selectedAvatarId !== lastAvatarIdRef.current) {
      // Avatar changed, restart session
      if (streaming) {
        setStreaming(false);
        if (startedSession?.sessionId) {
          stopHeyGenSession(startedSession.sessionId).catch(() => {});
        }
        setSession(null);
        setStartedSession(null);
      }
      setTimeout(() => {
        setStreaming(true);
      }, 1000);
      lastAvatarIdRef.current = selectedAvatarId;
    }
  }, [selectedAvatarId]);

  return (
    <ScreenContainer>
      {/* Remove Header and top language bar here */}
      {/* <Header title="Assistant" /> */}
      {/* ...language bar... */}

      {/* Modern Mode Toggle with Status Indicators */}
      <View
        style={{
          position: 'absolute',
          top: 32,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 2,
          backgroundColor: 'transparent',
          paddingHorizontal: 20,
        }}
      >
        {/* Primary Mode Toggle */}
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 30,
            flexDirection: 'row',
            alignItems: 'center',
            padding: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.06)',
            marginBottom: 12,
            minWidth: 280,
          }}
        >
          <TouchableOpacity
            onPress={() => handleModeSwitch('interactive')}
            style={{
              backgroundColor: currentMode === 'interactive' ? palette.primary : 'transparent',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
              ...(Platform.OS === 'ios' && currentMode === 'interactive' && {
                shadowColor: palette.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }),
            }}
          >
            <Ionicons 
              name={currentMode === 'interactive' ? "chatbubbles" : "chatbubbles-outline"} 
              size={18} 
              color={currentMode === 'interactive' ? palette.surface : palette.textSecondary} 
            />
            <Text style={{
              color: currentMode === 'interactive' ? palette.surface : palette.textSecondary,
              marginLeft: 8,
              fontWeight: currentMode === 'interactive' ? '700' : '600',
              fontSize: 15,
              letterSpacing: 0.3,
            }}>
              Interactive
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleModeSwitch('game')}
            style={{
              backgroundColor: currentMode === 'game' ? '#FF9800' : 'transparent',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
              ...(Platform.OS === 'ios' && currentMode === 'game' && {
                shadowColor: '#FF9800',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }),
            }}
          >
            <Ionicons 
              name={currentMode === 'game' ? "bulb" : "bulb-outline"} 
              size={18} 
              color={currentMode === 'game' ? palette.surface : palette.textSecondary} 
            />
            <Text style={{
              color: currentMode === 'game' ? palette.surface : palette.textSecondary,
              marginLeft: 8,
              fontWeight: currentMode === 'game' ? '700' : '600',
              fontSize: 15,
              letterSpacing: 0.3,
            }}>
              Games
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Status Indicators Container */}
        {currentMode === 'interactive' ? (
          // Interactive mode: Just language indicator
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              borderRadius: 18,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.04)',
            }}
          >
            <Ionicons name="globe-outline" size={16} color={palette.primary} />
            <Text style={{
              color: palette.primary,
              marginLeft: 6,
              fontWeight: '600',
              fontSize: 14,
              letterSpacing: 0.2,
            }}>
              {lastDetectedLanguage ? getLanguageDisplayName(lastDetectedLanguage) : 'Auto Detect'}
            </Text>
          </View>
        ) : (
          // Game mode: Language first, then game status side by side
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 20,
          }}>
            {/* Language Indicator */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                borderRadius: 18,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 3,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.04)',
                minWidth: 120,
              }}
            >
              <Ionicons name="globe-outline" size={16} color={palette.primary} />
              <Text style={{
                color: palette.primary,
                marginLeft: 6,
                fontWeight: '600',
                fontSize: 14,
                letterSpacing: 0.2,
              }}>
                {lastDetectedLanguage ? getLanguageDisplayName(lastDetectedLanguage) : 'Auto Detect'}
              </Text>
            </View>
            
            {/* Game Status Indicator */}
            <View
              style={{
                backgroundColor: currentGameSession 
                  ? 'rgba(76, 175, 80, 0.95)' // Green for active game
                  : 'rgba(158, 158, 158, 0.95)', // Gray for no game
                borderRadius: 18,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 3,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.04)',
                flex: 1,
                maxWidth: 180,
              }}
            >
              <Ionicons 
                name={currentGameSession ? "game-controller" : "game-controller-outline"} 
                size={16} 
                color="white" 
              />
              <Text 
                style={{
                  color: 'white',
                  marginLeft: 6,
                  fontWeight: '600',
                  fontSize: 14,
                  letterSpacing: 0.2,
                  flexShrink: 1,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {currentGameSession ? currentGameSession.title : 'No game selected'}
              </Text>
            </View>
          </View>
        )}
      </View>
      {/* Avatar Stream Area as Full-Screen Background (no offset, fills entire screen) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: windowWidth,
          height: windowHeight,
          zIndex: 0, // Ensure it's behind all other components
        }}
        pointerEvents="none" // Prevents this view from blocking touches
      >
        {/* Preview Image (on top of video) */}
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, opacity: fadeAnim, zIndex: 2 }}>
          {avatarPreviewUrl ? (
            <View style={{ flex: 1 }}>
              <Image
                source={{ uri: avatarPreviewUrl }}
                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                onError={e => {
                  console.log('Failed to load avatar preview image:', avatarPreviewUrl, e.nativeEvent);
                }}
              />
              {(sessionLoading || startLoading) && (
                <View style={{
                  ...StyleSheet.absoluteFillObject,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                }}>
                  <ActivityIndicator size="large" color={palette.primary} />
                </View>
              )}
            </View>
          ) : (
            <View style={{ flex: 1, backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          )}
        </Animated.View>
        {/* Video (underneath) */}
        {streaming && livekitUrl && livekitToken && (
          <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
            <LiveKitRoom
              serverUrl={livekitUrl}
              token={livekitToken}
              connect={true}
              audio={true}
              video={true}
            >
              <VideoDisplayWithReady isAvatarReady={isAvatarReady} setIsAvatarReady={setIsAvatarReady} />
            </LiveKitRoom>
          </View>
        )}
      </View>
      {/* Input Area */}
      {/* Remove input field and send button from the render */}
      {/* Status Messages */}
      {avatarLoading && <Text style={{ textAlign: 'center', color: palette.textSecondary, marginTop: spacing.sm }}>AI is thinking...</Text>}

      {/* Bottom Action Bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: spacing.xxl * 3, // Increased further from spacing.xxl * 2
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-end',
          zIndex: 10,
          pointerEvents: 'box-none',
        }}
        pointerEvents="box-none"
      >
        {/* Left small circle (chat/games) */}
        <TouchableOpacity
          onPress={() => {
            if (currentMode === 'game') {
              setShowGamesModal(true);
            } else {
              setShowChatHistory((prev) => !prev);
            }
          }}
          disabled={sttListening || isTranscribing}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.xl,
            opacity: sttListening || isTranscribing ? 0.5 : 1,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
              },
              android: {
                elevation: 8,
              },
            }),
          }}
        >
          <Ionicons
            name={
              currentMode === 'game' 
                ? 'game-controller-outline' 
                : showChatHistory 
                ? 'chevron-down' 
                : 'chatbubble-ellipses-outline'
            }
            size={28}
            color={palette.primary}
          />
        </TouchableOpacity>
        {/* Center large circle (mic) */}
        <Animated.View
          style={{
            transform: [{ scale: micPulseAnim }],
          }}
        >
          <TouchableOpacity
            onPress={handleMicPress}
            disabled={micDisabled || avatarLoading || audioPlaying || isAvatarSessionLoading || isTranscribing}
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: sttListening ? palette.error : (isTranscribing ? palette.accent : palette.primary),
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: spacing.xl,
              opacity: micDisabled || avatarLoading || audioPlaying || isAvatarSessionLoading || isTranscribing ? 0.5 : 1,
              ...Platform.select({
                ios: sttListening
                  ? {
                      shadowColor: palette.error,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.45,
                      shadowRadius: 24,
                    }
                  : {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 12,
                    },
                android: {
                  elevation: sttListening ? 16 : 8,
                },
              }),
              borderWidth: sttListening ? 3 : 0,
              borderColor: sttListening ? palette.primary : 'transparent',
            }}
          >
            <Ionicons 
              name="mic" 
              size={40} 
              color={palette.surface} 
            />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Avatar Speaking/Loading/Transcribing/Listening Indicator */}
        {(audioPlaying || avatarSpeaking || isAvatarSessionLoading || isTranscribing || sttListening) && (
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 120,
              left: 0,
              right: 0,
              alignItems: 'center',
              zIndex: 10,
              opacity: speakingIndicatorAnim,
              transform: [{ scale: speakingIndicatorAnim }],
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: 20,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Animated.View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: palette.primary,
                  marginRight: spacing.sm,
                  opacity: speakingIndicatorAnim,
                }}
              />
              <Text
                style={{
                  color: palette.surface,
                  fontSize: 14,
                  fontWeight: '600',
                }}
              >
                {isAvatarSessionLoading ? 'Applying changes...' : 
                 sttListening ? 
                   (currentMode === 'game' ? 'Game Master is listening...' : 'Avatar is listening...') :
                 isTranscribing ? 'Processing speech...' :
                 (currentMode === 'game' ? 'Game Master is speaking...' : 'Avatar is speaking...')}
              </Text>
            </View>
          </Animated.View>
        )}
        {/* Right small circle (settings) */}
        <TouchableOpacity
          onPress={() => setShowLanguageModal(true)}
          disabled={sttListening || isTranscribing}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: spacing.xl,
            opacity: sttListening || isTranscribing ? 0.5 : 1,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
              },
              android: {
                elevation: 8,
              },
            }),
          }}
        >
          <Ionicons name="settings-outline" size={28} color={palette.primary} />
        </TouchableOpacity>
      </View>
      {/* Chat History Modal */}
      <ChatHistoryModal
        visible={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        chat={chat}
        palette={palette}
        metrics={metrics}
        spacing={spacing}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        selectedLanguage="auto-detect"
        onLanguageSelect={() => {}} // No-op since we use auto detection
        voiceSpeed={currentVoiceSpeed}
        onVoiceSpeedChange={(newSpeed) => {
          setCurrentVoiceSpeed(newSpeed);
        }}
        selectedAvatarId={selectedAvatarId || undefined}
        onAvatarSelect={handleAvatarSelect}
        isAvatarSessionLoading={isAvatarSessionLoading}
        isAvatarSpeaking={audioPlaying || avatarSpeaking}
        detectedLanguage={lastDetectedLanguage}
        getLanguageDisplayName={getLanguageDisplayName}
        autoStartConversation={autoStartConversation}
        onToggleAutoStartConversation={(value) => {
          // If enabling during an active session, mark this session as already handled
          if (value && startedSession?.sessionId) {
            lastAutoStartSessionIdRef.current = startedSession.sessionId;
          }
          setAutoStartConversation(value);
          saveAutoStartPreference(value);
        }}
      />

      {/* Games Selection Modal */}
      <GamesSelectionModal
        visible={showGamesModal}
        onClose={() => setShowGamesModal(false)}
        onGameSelected={handleGameSelected}
      />
    </ScreenContainer>
  );
};

export default AiChatScreen; 