import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NetworkConfig {
  backendUrl: string;
  whisperUrl: string;
  memoryUrl: string;
}

/**
 * Timeout fetch with AbortController
 */
async function fetchWithTimeout(url: string, timeout: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get the host machine's IP address for development
 */
async function getHostIP(): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      // For web, use localhost
      return 'localhost';
    }
    
    console.log('[NetworkUtils] Auto-detecting host IP for backend connectivity...');
    
    // Get the device's own network info to determine the likely host IP
    const candidateIPs = await generateCandidateIPs();
    
    for (const testIP of candidateIPs) {
      try {
        // Test backend connectivity with auth endpoint (should return 401 but prove connectivity)
        const response = await fetchWithTimeout(`http://${testIP}:8080/auth/me`, 1200);
        // Any response from 200-499 means the server is reachable
        if (response.status >= 200 && response.status < 500) {
          console.log(`[NetworkUtils] Found backend at: ${testIP} (HTTP ${response.status})`);
          return testIP;
        }
      } catch (error) {
        // Continue testing other IPs - this is expected for most IPs
      }
    }

    // If no IP worked, fallback to localhost
    console.warn('[NetworkUtils] Could not detect host IP, using localhost fallback');
    return 'localhost';
    
  } catch (error) {
    console.error('[NetworkUtils] Error detecting host IP:', error);
    return 'localhost';
  }
}

/**
 * Generate candidate IPs to test for the backend
 */
async function generateCandidateIPs(): Promise<string[]> {
  const candidates: string[] = [];
  
  // Priority 1: Try common development IPs for different network types
  const highPriority = [
    // Common home network ranges where the host is likely to be
    '192.168.1.1', '192.168.1.2', '192.168.1.100', '192.168.1.101',
    '192.168.0.1', '192.168.0.2', '192.168.0.100', '192.168.0.101', 
    '192.168.68.1', '192.168.68.55', // Common mobile hotspot ranges
    // Corporate/office networks
    '10.0.0.1', '10.0.0.2', '10.0.1.1', '10.0.1.2',
    // Docker for Mac default
    '172.20.10.1', '172.20.10.2',
    'localhost', // Always test localhost too
  ];
  
  candidates.push(...highPriority);
  
  // Priority 2: Scan common subnet ranges more broadly
  const commonSubnets = [
    '192.168.1.', '192.168.0.', '192.168.68.', '192.168.4.',
    '10.0.0.', '10.0.1.', '172.20.10.', '172.16.0.',
  ];
  
  for (const subnet of commonSubnets) {
    // Test key IPs in each subnet (gateway, common host IPs)
    const keyIPs = [1, 2, 10, 50, 100, 101, 102, 200, 254];
    for (const ip of keyIPs) {
      const fullIP = `${subnet}${ip}`;
      if (!candidates.includes(fullIP)) {
        candidates.push(fullIP);
      }
    }
  }
  
  return candidates;
}

/**
 * Get network configuration based on environment
 */
export async function getNetworkConfig(): Promise<NetworkConfig> {
  // Check if we have explicit environment variables
  const explicitBackendUrl = process.env.EXPO_PUBLIC_API_URL;
  const explicitWhisperUrl = process.env.EXPO_PUBLIC_WHISPER_API_URL;
  const explicitMemoryUrl = process.env.EXPO_PUBLIC_MEMORY_API_URL;

  // If all URLs are explicitly set, use them
  if (explicitBackendUrl && explicitWhisperUrl && explicitMemoryUrl) {
    return {
      backendUrl: explicitBackendUrl,
      whisperUrl: explicitWhisperUrl,
      memoryUrl: explicitMemoryUrl,
    };
  }

  // 1) Fast-path: try cached config from AsyncStorage (trust cache to avoid any startup delay)
  try {
    const cached = await AsyncStorage.getItem('network_config_cache_v1');
    if (cached) {
      const parsed: NetworkConfig = JSON.parse(cached);
      console.log('[NetworkUtils] Using cached network config (no validation)');
      return parsed;
    }
  } catch (_) {
    // Ignore cache errors and fall through to detection
  }

  // Auto-detect host IP
  const hostIP = await getHostIP();

  // Check if we're in Docker environment
  const isDocker = process.env.EXPO_PUBLIC_DOCKER_ENV === 'true';

  let baseUrl: string;
  
  if (isDocker) {
    // In Docker, services are accessible by service name or host.docker.internal
    baseUrl = 'host.docker.internal'; // This works on Docker Desktop
    console.log('[NetworkUtils] Using Docker environment with host.docker.internal');
  } else {
    baseUrl = hostIP;
    console.log(`[NetworkUtils] Using detected host IP: ${hostIP}`);
  }

  const config: NetworkConfig = {
    backendUrl: explicitBackendUrl || `http://${baseUrl}:8080`,
    whisperUrl: explicitWhisperUrl || `http://${baseUrl}:8001`,
    memoryUrl: explicitMemoryUrl || `http://${baseUrl}:8000`,
  };

  console.log('[NetworkUtils] Network configuration:', config);
  // 2) Persist detected config for fast start next time
  try {
    await AsyncStorage.setItem('network_config_cache_v1', JSON.stringify(config));
  } catch (_) {}
  return config;
}

/**
 * Test connectivity to all services
 */
export async function testConnectivity(): Promise<{
  backend: boolean;
  whisper: boolean;
  memory: boolean;
}> {
  const config = await getNetworkConfig();
  
  const tests = {
    backend: false,
    whisper: false,
    memory: false,
  };

  // Test backend
  try {
    const response = await fetchWithTimeout(`${config.backendUrl}/actuator/health`, 5000);
    tests.backend = response.ok;
  } catch (error) {
    console.warn('[NetworkUtils] Backend connectivity test failed:', error);
  }

  // Test whisper
  try {
    const response = await fetchWithTimeout(`${config.whisperUrl}/health`, 5000);
    tests.whisper = response.ok;
  } catch (error) {
    console.warn('[NetworkUtils] Whisper connectivity test failed:', error);
  }

  // Test memory service
  try {
    const response = await fetchWithTimeout(`${config.memoryUrl}/docs`, 5000);
    tests.memory = response.ok;
  } catch (error) {
    console.warn('[NetworkUtils] Memory service connectivity test failed:', error);
  }

  console.log('[NetworkUtils] Connectivity test results:', tests);
  return tests;
}

/**
 * Get the current network configuration (cached)
 */
let cachedConfig: NetworkConfig | null = null;

export async function getCurrentNetworkConfig(): Promise<NetworkConfig> {
  if (!cachedConfig) {
    cachedConfig = await getNetworkConfig();
  }
  return cachedConfig;
}

/**
 * Clear cached network configuration (useful for refreshing)
 */
export function clearNetworkCache(): void {
  cachedConfig = null;
}
