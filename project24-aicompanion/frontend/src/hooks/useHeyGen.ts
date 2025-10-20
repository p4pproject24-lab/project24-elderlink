import { useState } from 'react';
import {
  getHeyGenSessionToken,
  createHeyGenSession,
  startHeyGenSession,
  sendHeyGenTask,
} from '../services/heygenService';
import {
  HeyGenSessionRequest,
  HeyGenStartSessionRequest,
  HeyGenSessionResponse,
} from '../types/HeyGen';
import { ApiResponse } from '../types/ApiResponse';

export function useHeyGen() {
  // Session Token
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Session Creation
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [session, setSession] = useState<HeyGenSessionResponse | null>(null);

  // Session Start
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [startedSession, setStartedSession] = useState<HeyGenSessionResponse | null>(null);

  // Actions
  const fetchSessionToken = async () => {
    setTokenLoading(true);
    setTokenError(null);
    try {
      const res: ApiResponse<string> = await getHeyGenSessionToken();
      setToken(res.data || null);
    } catch (e: any) {
      setTokenError(e?.message || 'Failed to fetch session token');
    } finally {
      setTokenLoading(false);
    }
  };

  const createSessionAction = async (payload: HeyGenSessionRequest) => {
    setSessionLoading(true);
    setSessionError(null);
    try {
      const res = await createHeyGenSession(payload);
      setSession(res.data || null);
    } catch (e: any) {
      setSessionError(e?.message || 'Failed to create session');
    } finally {
      setSessionLoading(false);
    }
  };

  const startSessionAction = async (payload: HeyGenStartSessionRequest) => {
    setStartLoading(true);
    setStartError(null);
    try {
      await startHeyGenSession(payload);
      setStartedSession(session);
    } catch (e: any) {
      setStartError(e?.message || 'Failed to start session');
    } finally {
      setStartLoading(false);
    }
  };

  // New: Send a task (text) to the avatar for live speech
  const sendTaskAction = async (sessionId: string, text: string, taskType: string = 'talk') => {
    await sendHeyGenTask(sessionId, text, taskType);
  };

  return {
    // Session Token
    tokenLoading,
    tokenError,
    token,
    fetchSessionToken,
    // Session Creation
    sessionLoading,
    sessionError,
    session,
    setSession,
    createSessionAction,
    // Session Start
    startLoading,
    startError,
    startedSession,
    setStartedSession,
    startSessionAction,
    // Task (avatar speech)
    sendTaskAction,
  };
} 