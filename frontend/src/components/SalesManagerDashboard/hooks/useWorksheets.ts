/**
 * Hook for managing worksheets
 */

import { useState, useEffect, useCallback } from 'react';
import type { WorksheetData } from '../types';
import { API_BASE_URL, REFRESH_INTERVAL } from '../constants';

interface UseWorksheetsReturn {
  worksheets: WorksheetData[];
  loading: boolean;
  selectedWorksheet: WorksheetData | null;
  selectWorksheet: (worksheet: WorksheetData | null) => void;
  refresh: () => Promise<void>;
  sendCounterOffer: (worksheetId: string, adjustment: number, notes: string) => Promise<boolean>;
  acceptDeal: (worksheetId: string) => Promise<boolean>;
  sendingCounterOffer: boolean;
}

export const useWorksheets = (autoRefresh: boolean, isActive: boolean): UseWorksheetsReturn => {
  const [worksheets, setWorksheets] = useState<WorksheetData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorksheet, setSelectedWorksheet] = useState<WorksheetData | null>(null);
  const [sendingCounterOffer, setSendingCounterOffer] = useState(false);

  const fetchWorksheets = useCallback(async () => {
    if (!isActive) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/worksheet/manager/active`);
      if (response.ok) {
        const data = await response.json();
        setWorksheets(data.worksheets || []);
      }
    } catch (err) {
      console.error('Error fetching worksheets:', err);
    } finally {
      setLoading(false);
    }
  }, [isActive]);

  const sendCounterOffer = useCallback(async (
    worksheetId: string, 
    adjustment: number, 
    notes: string
  ): Promise<boolean> => {
    setSendingCounterOffer(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/worksheet/manager/${worksheetId}/counter-offer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adjustment: -Math.abs(adjustment),
            notes,
          }),
        }
      );
      
      if (response.ok) {
        await fetchWorksheets();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error sending counter-offer:', err);
      return false;
    } finally {
      setSendingCounterOffer(false);
    }
  }, [fetchWorksheets]);

  const acceptDeal = useCallback(async (worksheetId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/worksheet/manager/${worksheetId}/accept`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        await fetchWorksheets();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error accepting deal:', err);
      return false;
    }
  }, [fetchWorksheets]);

  // Fetch when active
  useEffect(() => {
    if (isActive) {
      fetchWorksheets();
    }
  }, [isActive, fetchWorksheets]);

  // Auto-refresh
  useEffect(() => {
    if (!isActive || !autoRefresh) return;
    
    const interval = setInterval(fetchWorksheets, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [isActive, autoRefresh, fetchWorksheets]);

  return {
    worksheets,
    loading,
    selectedWorksheet,
    selectWorksheet: setSelectedWorksheet,
    refresh: fetchWorksheets,
    sendCounterOffer,
    acceptDeal,
    sendingCounterOffer,
  };
};
