import { useCallback, useEffect, useState } from 'react';
import type { FollowUpTurn, StudySession } from '../types/study';

const STORAGE_KEY = 'snapsolve_ai_sessions_v1';
const MAX_SAVED_SESSIONS = 10;

function readStoredSessions(): StudySession[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StudySession[];
  } catch {
    return [];
  }
}

function writeStoredSessions(sessions: StudySession[]): void {
  let candidate = sessions.slice(0, MAX_SAVED_SESSIONS);
  while (candidate.length > 0) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
      return;
    } catch {
      // Trim oldest session if browser localStorage quota is tight
      candidate = candidate.slice(0, candidate.length - 1);
    }
  }
}

export function useLocalStorageSessions() {
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    if (typeof window === 'undefined') return [];
    return readStoredSessions();
  });

  useEffect(() => {
    writeStoredSessions(sessions);
  }, [sessions]);

  const saveSession = useCallback((newSession: StudySession) => {
    setSessions((prev) => {
      const filtered = prev.filter((item) => item.id !== newSession.id);
      return [newSession, ...filtered].slice(0, MAX_SAVED_SESSIONS);
    });
  }, []);

  const updateSessionFollowUps = useCallback((sessionId: string, followUps: FollowUpTurn[]) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, followUps } : session
      )
    );
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
  }, []);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage access errors in restricted modes
    }
  }, []);

  return {
    sessions,
    saveSession,
    updateSessionFollowUps,
    deleteSession,
    clearAllSessions,
  };
}
