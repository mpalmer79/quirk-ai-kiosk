/**
 * Hook for managing customer sessions
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import type { CustomerSession, SessionDetail } from '../types';
import { REFRESH_INTERVAL } from '../constants';

interface UseSessionsReturn {
  sessions: CustomerSession[];
  loading: boolean;
  selectedSession: CustomerSession | null;
  sessionDetail: SessionDetail | null;
  loadingDetail: boolean;
  lastUpdate: string;
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  selectSession: (session: CustomerSession) => void;
  clearSelection: () => void;
  refresh: () => void;
}

export const useSessions = (): UseSessionsReturn => {
  const [sessions, setSessions] = useState<CustomerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<CustomerSession | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSessions = useCallback(async (isInitialLoad: boolean = false) => {
    try {
      const data = await api.getActiveSessions(60);
      setSessions(data.sessions || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, []);

  const fetchSessionDetail = useCallback(async (sessionId: string) => {
    setLoadingDetail(true);
    try {
      const data = await api.getTrafficSession(sessionId);
      setSessionDetail(data as unknown as SessionDetail);
    } catch (err) {
      console.error('Error fetching session detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const selectSession = useCallback((session: CustomerSession) => {
    setSelectedSession(session);
    fetchSessionDetail(session.sessionId);
  }, [fetchSessionDetail]);

  const clearSelection = useCallback(() => {
    setSelectedSession(null);
    setSessionDetail(null);
  }, []);

  // Initial load
  useEffect(() => {
    fetchSessions(true);
  }, [fetchSessions]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => fetchSessions(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchSessions]);

  // Update selected session when sessions refresh
  useEffect(() => {
    if (selectedSession) {
      const updated = sessions.find(s => s.sessionId === selectedSession.sessionId);
      if (updated) setSelectedSession(updated);
    }
  }, [sessions, selectedSession]);

  return {
    sessions,
    loading,
    selectedSession,
    sessionDetail,
    loadingDetail,
    lastUpdate,
    autoRefresh,
    setAutoRefresh,
    selectSession,
    clearSelection,
    refresh: () => fetchSessions(false),
  };
};
