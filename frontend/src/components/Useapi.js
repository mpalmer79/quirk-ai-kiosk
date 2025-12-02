/**
 * Quirk AI Kiosk - API Hooks
 * React hooks for managing API calls with loading states and error handling
 */

import { useState, useCallback, useEffect } from 'react';
import api from './api';

/**
 * Generic hook for API calls with loading and error states
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (apiCall, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { loading, error, data, execute, reset };
};

/**
 * Hook for inventory operations
 */
export const useInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventory = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.getInventory(filters);
      setInventory(result.vehicles || result);
      return result;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const result = await api.getInventoryStats();
      setStats(result);
      return result;
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      return null;
    }
  }, []);

  const searchByStock = useCallback(async (stockNumber) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.getVehicleByStock(stockNumber);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByPreferences = useCallback(async (preferences) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.searchByPreferences(preferences);
      setInventory(result.vehicles || result);
      return result;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    inventory,
    stats,
    loading,
    error,
    fetchInventory,
    fetchStats,
    searchByStock,
    searchByPreferences,
  };
};

/**
 * Hook for trade-in operations
 */
export const useTradeIn = () => {
  const [estimate, setEstimate] = useState(null);
  const [decodedVin, setDecodedVin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getEstimate = useCallback(async (vehicleData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.getTradeInEstimate(vehicleData);
      setEstimate(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const decodeVin = useCallback(async (vin) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.decodeTradeInVin(vin);
      setDecodedVin(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestAppraisal = useCallback(async (tradeInData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.requestAppraisal(tradeInData);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setEstimate(null);
    setDecodedVin(null);
    setError(null);
  }, []);

  return {
    estimate,
    decodedVin,
    loading,
    error,
    getEstimate,
    decodeVin,
    requestAppraisal,
    reset,
  };
};

/**
 * Hook for payment calculations
 */
export const usePayments = () => {
  const [leasePayment, setLeasePayment] = useState(null);
  const [financePayment, setFinancePayment] = useState(null);
  const [rebates, setRebates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateLease = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.calculateLease(params);
      setLeasePayment(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateFinance = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.calculateFinance(params);
      setFinancePayment(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRebates = useCallback(async (vehicleId) => {
    try {
      const result = await api.getRebates(vehicleId);
      setRebates(result.rebates || result);
      return result;
    } catch (err) {
      console.error('Failed to fetch rebates:', err);
      return [];
    }
  }, []);

  return {
    leasePayment,
    financePayment,
    rebates,
    loading,
    error,
    calculateLease,
    calculateFinance,
    fetchRebates,
  };
};

/**
 * Hook for lead submission and handoff
 */
export const useLeads = () => {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitLead = useCallback(async (leadData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.submitLead(leadData);
      setSubmission(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleTestDrive = useCallback(async (appointmentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.scheduleTestDrive(appointmentData);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendSummary = useCallback(async (phone, dealData) => {
    try {
      const result = await api.sendDealSummary(phone, dealData);
      return result;
    } catch (err) {
      console.error('Failed to send summary:', err);
      return null;
    }
  }, []);

  return {
    submission,
    loading,
    error,
    submitLead,
    scheduleTestDrive,
    sendSummary,
  };
};

/**
 * Hook for vehicle data (makes, models, trims)
 */
export const useVehicleData = () => {
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [trims, setTrims] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMakes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getMakes();
      setMakes(result.makes || result);
      return result;
    } catch (err) {
      console.error('Failed to fetch makes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchModels = useCallback(async (make) => {
    setLoading(true);
    try {
      const result = await api.getModels(make);
      setModels(result.models || result);
      return result;
    } catch (err) {
      console.error('Failed to fetch models:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrims = useCallback(async (make, model, year) => {
    setLoading(true);
    try {
      const result = await api.getTrims(make, model, year);
      setTrims(result.trims || result);
      return result;
    } catch (err) {
      console.error('Failed to fetch trims:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    makes,
    models,
    trims,
    loading,
    fetchMakes,
    fetchModels,
    fetchTrims,
  };
};

export default {
  useApi,
  useInventory,
  useTradeIn,
  usePayments,
  useLeads,
  useVehicleData,
};
